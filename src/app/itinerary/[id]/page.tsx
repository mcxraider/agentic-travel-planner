'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useItineraryStore, useTripStore, EventConflictMap, useDebugLog } from '@/store';
import {
  ItineraryHeader,
  TimelineView,
  EditChatSidebar,
  AddEventForm,
  OptimizationModal,
  AddAlternativeForm,
} from '@/components/itinerary';
import { Event, Conflict, Optimization } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ItineraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const debugLog = useDebugLog();

  const { tripData } = useTripStore();
  const {
    itinerary,
    selectedEventIds,
    editSidebarOpen,
    hasUnsavedChanges,
    undoStack,
    warnings,
    eventConflicts,
    visualSelections,
    setEditSidebarOpen,
    toggleEventSelection,
    clearSelection,
    pushUndo,
    undo,
    moveEvent,
    deleteEvent,
    addEvent,
    applyChanges,
    addAlternative,
    dismissWarning,
    setEventConflicts,
    dismissEventConflict,
    clearEventConflicts,
    setVisualSelection,
    applyVisualSelections,
  } = useItineraryStore();

  const [addEventDayNumber, setAddEventDayNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // Confirmation dialog state
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);

  // Optimization modal state
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);

  // Add alternative form state
  const [addAlternativeEvent, setAddAlternativeEvent] = useState<{ dayNumber: number; event: Event } | null>(null);

  // Check if we have the necessary data
  useEffect(() => {
    // Small delay to allow store hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut for undo (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (undoStack.length > 0) {
          undo();
          toast({
            title: 'Undone',
            description: 'Last action has been reverted.',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, undoStack.length, toast]);

  // Handle event selection
  const handleSelectEvent = useCallback(
    (eventId: string, multiSelect: boolean) => {
      if (!multiSelect) {
        clearSelection();
      }
      toggleEventSelection(eventId);
    },
    [clearSelection, toggleEventSelection]
  );

  // Handle event deletion
  const handleDeleteEvent = useCallback(
    (dayNumber: number, eventId: string) => {
      debugLog('user_action', 'Deleted event', { dayNumber, eventId });
      pushUndo();
      deleteEvent(dayNumber, eventId);
      toast({
        title: 'Event deleted',
        description: 'The event has been removed from your itinerary.',
      });
    },
    [pushUndo, deleteEvent, toast, debugLog]
  );

  // Handle moving event (drag-drop)
  const handleMoveEvent = useCallback(
    (eventId: string, fromDay: number, toDay: number, newIndex?: number) => {
      debugLog('user_action', 'Moved event', { eventId, fromDay, toDay, newIndex });
      pushUndo();
      moveEvent(eventId, fromDay, toDay, newIndex);
    },
    [pushUndo, moveEvent, debugLog]
  );

  // Handle drag start - push undo before any drag operation
  const handleDragStart = useCallback(() => {
    // Undo is pushed in handleMoveEvent when the drag ends
  }, []);

  // Handle adding event
  const handleAddEvent = useCallback(
    (dayNumber: number, event: Event) => {
      debugLog('user_action', 'Added event', { dayNumber, title: event.title });
      pushUndo();
      addEvent(dayNumber, event);
      toast({
        title: 'Event added',
        description: `Added "${event.title}" to Day ${dayNumber}.`,
      });
    },
    [pushUndo, addEvent, toast, debugLog]
  );

  // Handle deleting selected events
  const handleDeleteSelected = useCallback(() => {
    if (selectedEventIds.length === 0) return;

    pushUndo();

    // Find and delete all selected events
    if (itinerary) {
      itinerary.days.forEach((day) => {
        day.events.forEach((event) => {
          if (selectedEventIds.includes(event.id)) {
            deleteEvent(day.day_number, event.id);
          }
        });
      });
    }

    clearSelection();
    toast({
      title: 'Events deleted',
      description: `Removed ${selectedEventIds.length} event(s) from your itinerary.`,
    });
  }, [selectedEventIds, itinerary, pushUndo, deleteEvent, clearSelection, toast]);

  // Handle apply changes - triggers validation
  const handleApplyChanges = useCallback(async () => {
    if (!itinerary) return;

    debugLog('user_action', 'Apply changes clicked');

    // First, apply any visual selections (cycling) to the actual data
    if (Object.keys(visualSelections).length > 0) {
      debugLog('state_change', 'Applying visual selections', { count: Object.keys(visualSelections).length });
      applyVisualSelections();
    }

    setIsValidating(true);
    debugLog('api_request', 'Validating itinerary changes');

    try {
      const response = await fetch('/api/mock/validate-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary }),
      });

      const result = await response.json();

      if (result.conflicts.length > 0) {
        // Show toast with conflict count
        toast({
          title: `${result.conflicts.length} conflict${result.conflicts.length > 1 ? 's' : ''} detected`,
          description: 'Conflicting events are highlighted in red. You can dismiss warnings or fix them.',
          variant: 'destructive',
        });

        // Convert conflicts to event conflict map
        const conflictMap: EventConflictMap = {};
        result.conflicts.forEach((conflict: Conflict) => {
          conflict.eventIds.forEach((eventId) => {
            conflictMap[eventId] = conflict.message;
          });
        });

        // Set conflicts in store (highlights events)
        setEventConflicts(conflictMap);

        // Store pending conflicts for confirmation dialog
        setPendingConflicts(result.conflicts);

        // Show confirmation dialog
        setShowSaveConfirmDialog(true);
      } else {
        // No conflicts, save changes
        clearEventConflicts();
        applyChanges();
        toast({
          title: 'Changes saved',
          description: 'Your itinerary has been updated.',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      // On error, save anyway
      applyChanges();
      toast({
        title: 'Changes saved',
        description: 'Your itinerary has been updated.',
      });
    } finally {
      setIsValidating(false);
    }
  }, [itinerary, applyChanges, toast, setEventConflicts, clearEventConflicts, visualSelections, applyVisualSelections, debugLog]);

  // Handle confirming save with conflicts
  const handleConfirmSaveWithConflicts = useCallback(() => {
    setShowSaveConfirmDialog(false);
    applyChanges();
    toast({
      title: 'Changes saved with warnings',
      description: `${pendingConflicts.length} conflict${pendingConflicts.length > 1 ? 's' : ''} remain. You can dismiss them individually.`,
    });
    setPendingConflicts([]);
  }, [applyChanges, toast, pendingConflicts.length]);

  // Handle canceling save (go back to editing)
  const handleCancelSave = useCallback(() => {
    setShowSaveConfirmDialog(false);
    setPendingConflicts([]);
    // Keep the conflict highlighting so user can see what needs fixing
  }, []);

  // Handle dismissing event conflict
  const handleDismissConflict = useCallback((eventId: string) => {
    dismissEventConflict(eventId);
  }, [dismissEventConflict]);

  // Handle optimize itinerary
  const handleOptimize = useCallback(async () => {
    if (!itinerary) return;

    setIsValidating(true);

    try {
      const response = await fetch('/api/mock/validate-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary }),
      });

      const result = await response.json();

      if (result.optimizations.length > 0) {
        setOptimizations(result.optimizations);
        setShowOptimizationModal(true);
      } else {
        toast({
          title: 'Already optimized',
          description: 'No optimization suggestions available.',
        });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get optimization suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }, [itinerary, toast]);

  // Handle optimization modal actions
  const handleApplyOptimizations = useCallback((optimizationIds: string[]) => {
    // In a real app, this would apply the selected optimizations
    console.log('Applying optimizations:', optimizationIds);
    setShowOptimizationModal(false);
    applyChanges();
    toast({
      title: 'Changes saved',
      description: `Applied ${optimizationIds.length} optimization(s).`,
    });
  }, [applyChanges, toast]);

  const handleSkipOptimizations = useCallback(() => {
    setShowOptimizationModal(false);
    applyChanges();
    toast({
      title: 'Changes saved',
      description: 'Your itinerary has been updated.',
    });
  }, [applyChanges, toast]);

  // Handle adding alternative
  const handleOpenAddAlternative = useCallback((dayNumber: number, event: Event) => {
    setAddAlternativeEvent({ dayNumber, event });
  }, []);

  const handleAddAlternative = useCallback(
    (dayNumber: number, primaryEventId: string, alternativeEvent: Event) => {
      debugLog('user_action', 'Added alternative event', { dayNumber, primaryEventId, title: alternativeEvent.title });
      pushUndo();
      addAlternative(dayNumber, primaryEventId, alternativeEvent);
      toast({
        title: 'Alternative added',
        description: `Added "${alternativeEvent.title}" as an alternative.`,
      });
    },
    [pushUndo, addAlternative, toast, debugLog]
  );

  // Handle visual selection change (cycling through alternatives)
  const handleVisualSelectionChange = useCallback(
    (groupId: string, eventId: string) => {
      setVisualSelection(groupId, eventId);
    },
    [setVisualSelection]
  );

  // Handle dismiss warning
  const handleDismissWarning = useCallback((warningId: string) => {
    dismissWarning(warningId);
  }, [dismissWarning]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undo();
    toast({
      title: 'Undone',
      description: 'Last action has been reverted.',
    });
  }, [undo, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No data state
  if (!itinerary || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Itinerary Found</h1>
          <p className="text-muted-foreground mb-4">
            It looks like you haven&apos;t created an itinerary yet.
          </p>
          <button
            onClick={() => router.push('/plan')}
            className="text-blue-600 hover:underline"
          >
            Start planning your trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ItineraryHeader
        tripData={tripData}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={undoStack.length > 0}
        isSidebarOpen={editSidebarOpen}
        isValidating={isValidating}
        onApplyChanges={handleApplyChanges}
        onOptimize={handleOptimize}
        onUndo={handleUndo}
        onToggleSidebar={() => setEditSidebarOpen(!editSidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          editSidebarOpen ? 'mr-96' : 'mr-0'
        )}
      >
        <main className="max-w-4xl mx-auto px-6 py-6">
          <TimelineView
            itinerary={itinerary}
            selectedEventIds={selectedEventIds}
            warnings={warnings}
            eventConflicts={eventConflicts}
            visualSelections={visualSelections}
            onSelectEvent={handleSelectEvent}
            onDeleteEvent={handleDeleteEvent}
            onMoveEvent={handleMoveEvent}
            onAddEvent={(dayNumber) => setAddEventDayNumber(dayNumber)}
            onAddAlternative={handleOpenAddAlternative}
            onVisualSelectionChange={handleVisualSelectionChange}
            onDismissWarning={handleDismissWarning}
            onDismissConflict={handleDismissConflict}
            onDragStart={handleDragStart}
          />
        </main>
      </div>

      {/* Edit Chat Sidebar */}
      <EditChatSidebar
        isOpen={editSidebarOpen}
        itinerary={itinerary}
        selectedEventIds={selectedEventIds}
        onClose={() => setEditSidebarOpen(false)}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Event Dialog */}
      <AddEventForm
        isOpen={addEventDayNumber !== null}
        dayNumber={addEventDayNumber || 1}
        onClose={() => setAddEventDayNumber(null)}
        onAddEvent={handleAddEvent}
      />

      {/* Add Alternative Dialog */}
      <AddAlternativeForm
        isOpen={addAlternativeEvent !== null}
        primaryEvent={addAlternativeEvent?.event || null}
        dayNumber={addAlternativeEvent?.dayNumber || 1}
        onClose={() => setAddAlternativeEvent(null)}
        onAddAlternative={handleAddAlternative}
      />

      {/* Save with Conflicts Confirmation Dialog */}
      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save with conflicts?</AlertDialogTitle>
            <AlertDialogDescription>
              Your itinerary has {pendingConflicts.length} conflict{pendingConflicts.length > 1 ? 's' : ''} that haven&apos;t been resolved.
              Conflicting events are highlighted in red. You can save anyway and address them later, or go back to fix them now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>
              Go back and fix
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveWithConflicts}>
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={showOptimizationModal}
        optimizations={optimizations}
        onClose={() => setShowOptimizationModal(false)}
        onApplyOptimizations={handleApplyOptimizations}
        onSkip={handleSkipOptimizations}
      />
    </div>
  );
}

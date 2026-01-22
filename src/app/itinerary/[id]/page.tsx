'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useItineraryStore, useTripStore } from '@/store';
import {
  ItineraryHeader,
  TimelineView,
  EditChatSidebar,
  AddEventForm,
} from '@/components/itinerary';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ItineraryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { tripData } = useTripStore();
  const {
    itinerary,
    selectedEventIds,
    editSidebarOpen,
    hasUnsavedChanges,
    undoStack,
    setEditSidebarOpen,
    toggleEventSelection,
    clearSelection,
    pushUndo,
    undo,
    moveEvent,
    deleteEvent,
    addEvent,
    applyChanges,
  } = useItineraryStore();

  const [addEventDayNumber, setAddEventDayNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      pushUndo();
      deleteEvent(dayNumber, eventId);
      toast({
        title: 'Event deleted',
        description: 'The event has been removed from your itinerary.',
      });
    },
    [pushUndo, deleteEvent, toast]
  );

  // Handle moving event (drag-drop)
  const handleMoveEvent = useCallback(
    (eventId: string, fromDay: number, toDay: number, newIndex?: number) => {
      pushUndo();
      moveEvent(eventId, fromDay, toDay, newIndex);
    },
    [pushUndo, moveEvent]
  );

  // Handle drag start - push undo before any drag operation
  const handleDragStart = useCallback(() => {
    // Undo is pushed in handleMoveEvent when the drag ends
  }, []);

  // Handle adding event
  const handleAddEvent = useCallback(
    (dayNumber: number, event: Event) => {
      pushUndo();
      addEvent(dayNumber, event);
      toast({
        title: 'Event added',
        description: `Added "${event.title}" to Day ${dayNumber}.`,
      });
    },
    [pushUndo, addEvent, toast]
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

  // Handle apply changes
  const handleApplyChanges = useCallback(() => {
    applyChanges();
    toast({
      title: 'Changes saved',
      description: 'Your itinerary has been updated.',
    });
  }, [applyChanges, toast]);

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
        itinerary={itinerary}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={undoStack.length > 0}
        isSidebarOpen={editSidebarOpen}
        onApplyChanges={handleApplyChanges}
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
            onSelectEvent={handleSelectEvent}
            onDeleteEvent={handleDeleteEvent}
            onMoveEvent={handleMoveEvent}
            onAddEvent={(dayNumber) => setAddEventDayNumber(dayNumber)}
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
    </div>
  );
}

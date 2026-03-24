'use client';

import { useCallback, useState } from 'react';
import { useItineraryStore, EventConflictMap, useDebugLog } from '@/store';
import { Event, Conflict, Itinerary, Optimization } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UseItineraryEditResult {
  // State
  isValidating: boolean;
  pendingConflicts: Conflict[];
  showSaveConfirmDialog: boolean;
  optimizations: Optimization[];
  showOptimizationModal: boolean;
  addEventDayNumber: number | null;
  addAlternativeEvent: { dayNumber: number; event: Event } | null;
  editEventData: { dayNumber: number; event: Event } | null;

  // Event handlers
  handleSelectEvent: (eventId: string, multiSelect: boolean) => void;
  handleDeleteEvent: (dayNumber: number, eventId: string) => void;
  handleDeleteSelected: () => void;
  handleMoveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  handleAddEvent: (dayNumber: number, event: Event) => void;
  handleDragStart: () => void;

  // Alternatives
  handleOpenAddAlternative: (dayNumber: number, event: Event) => void;
  handleCloseAddAlternative: () => void;
  handleAddAlternative: (
    dayNumber: number,
    primaryEventId: string,
    alternativeEvent: Event
  ) => void;
  handleVisualSelectionChange: (groupId: string, eventId: string) => void;

  // Validation and conflicts
  handleApplyChanges: () => Promise<Itinerary | null>;
  handleConfirmSaveWithConflicts: () => void;
  handleCancelSave: () => void;
  handleDismissConflict: (eventId: string) => void;
  handleDismissWarning: (warningId: string) => void;

  // Optimization
  handleOptimize: () => Promise<void>;
  handleApplyOptimizations: (optimizationIds: string[]) => void;
  handleSkipOptimizations: () => void;
  handleCloseOptimizationModal: () => void;

  // Undo
  handleUndo: () => void;

  // Edit event
  handleOpenEditEvent: (dayNumber: number, event: Event) => void;
  handleCloseEditEvent: () => void;
  handleEditEvent: (dayNumber: number, eventId: string, updatedFields: Partial<Event>) => void;

  // Add event modal
  handleOpenAddEvent: (dayNumber: number) => void;
  handleCloseAddEvent: () => void;
}

/**
 * Hook that encapsulates all itinerary editing logic.
 * Extracts business logic from the itinerary page component for reusability and testability.
 *
 * Handles:
 * - Event selection, deletion, movement, and addition
 * - Alternative event management
 * - Validation with conflict detection
 * - Optimization suggestions
 * - Undo functionality
 *
 * @example
 * const {
 *   handleSelectEvent,
 *   handleDeleteEvent,
 *   handleApplyChanges,
 *   isValidating,
 *   ...
 * } = useItineraryEdit();
 */
export function useItineraryEdit(): UseItineraryEditResult {
  const { toast } = useToast();
  const debugLog = useDebugLog();

  const {
    itinerary,
    selectedEventIds,
    visualSelections,
    pushUndo,
    undo,
    clearSelection,
    toggleEventSelection,
    deleteEvent,
    editEvent,
    moveEvent,
    addEvent,
    addAlternative,
    applyChanges,
    dismissWarning,
    setEventConflicts,
    dismissEventConflict,
    clearEventConflicts,
    setVisualSelection,
    applyVisualSelections,
  } = useItineraryStore();

  // Local state for dialogs and validation
  const [isValidating, setIsValidating] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [addEventDayNumber, setAddEventDayNumber] = useState<number | null>(null);
  const [addAlternativeEvent, setAddAlternativeEvent] = useState<{
    dayNumber: number;
    event: Event;
  } | null>(null);
  const [editEventData, setEditEventData] = useState<{
    dayNumber: number;
    event: Event;
  } | null>(null);

  // Event selection
  const handleSelectEvent = useCallback(
    (eventId: string, multiSelect: boolean) => {
      if (!multiSelect) {
        clearSelection();
      }
      toggleEventSelection(eventId);
    },
    [clearSelection, toggleEventSelection]
  );

  // Event deletion
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

  // Delete selected events
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

  // Event movement (drag-drop)
  const handleMoveEvent = useCallback(
    (eventId: string, fromDay: number, toDay: number, newIndex?: number) => {
      debugLog('user_action', 'Moved event', { eventId, fromDay, toDay, newIndex });
      pushUndo();
      moveEvent(eventId, fromDay, toDay, newIndex);
    },
    [pushUndo, moveEvent, debugLog]
  );

  // Drag start (undo is pushed on drop in handleMoveEvent)
  const handleDragStart = useCallback(() => {
    // Undo is pushed in handleMoveEvent when the drag ends
  }, []);

  // Add event
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

  // Add event modal
  const handleOpenAddEvent = useCallback((dayNumber: number) => {
    setAddEventDayNumber(dayNumber);
  }, []);

  const handleCloseAddEvent = useCallback(() => {
    setAddEventDayNumber(null);
  }, []);

  // Edit event
  const handleOpenEditEvent = useCallback((dayNumber: number, event: Event) => {
    setEditEventData({ dayNumber, event });
  }, []);

  const handleCloseEditEvent = useCallback(() => {
    setEditEventData(null);
  }, []);

  const handleEditEvent = useCallback(
    (dayNumber: number, eventId: string, updatedFields: Partial<Event>) => {
      debugLog('user_action', 'Edited event', { dayNumber, eventId });
      pushUndo();
      editEvent(dayNumber, eventId, updatedFields);
      toast({
        title: 'Event updated',
        description: 'Your changes have been saved.',
      });
    },
    [pushUndo, editEvent, toast, debugLog]
  );

  // Alternatives
  const handleOpenAddAlternative = useCallback((dayNumber: number, event: Event) => {
    setAddAlternativeEvent({ dayNumber, event });
  }, []);

  const handleCloseAddAlternative = useCallback(() => {
    setAddAlternativeEvent(null);
  }, []);

  const handleAddAlternative = useCallback(
    (dayNumber: number, primaryEventId: string, alternativeEvent: Event) => {
      debugLog('user_action', 'Added alternative event', {
        dayNumber,
        primaryEventId,
        title: alternativeEvent.title,
      });
      pushUndo();
      addAlternative(dayNumber, primaryEventId, alternativeEvent);
      toast({
        title: 'Alternative added',
        description: `Added "${alternativeEvent.title}" as an alternative.`,
      });
    },
    [pushUndo, addAlternative, toast, debugLog]
  );

  const handleVisualSelectionChange = useCallback(
    (groupId: string, eventId: string) => {
      setVisualSelection(groupId, eventId);
    },
    [setVisualSelection]
  );

  // Apply changes with validation
  const handleApplyChanges = useCallback(async () => {
    if (!itinerary) return null;

    debugLog('user_action', 'Apply changes clicked');

    // First, apply any visual selections (cycling) to the actual data
    if (Object.keys(visualSelections).length > 0) {
      debugLog('state_change', 'Applying visual selections', {
        count: Object.keys(visualSelections).length,
      });
      applyVisualSelections();
    }

    const itineraryToValidate = useItineraryStore.getState().itinerary;
    if (!itineraryToValidate) {
      return null;
    }

    setIsValidating(true);
    debugLog('api_request', 'Validating itinerary changes');

    try {
      const response = await fetch('/api/mock/validate-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: itineraryToValidate }),
      });

      const result = await response.json();

      if (result.conflicts.length > 0) {
        toast({
          title: `${result.conflicts.length} conflict${result.conflicts.length > 1 ? 's' : ''} detected`,
          description:
            'Conflicting events are highlighted in red. You can dismiss warnings or fix them.',
          variant: 'destructive',
        });

        // Convert conflicts to event conflict map
        const conflictMap: EventConflictMap = {};
        result.conflicts.forEach((conflict: Conflict) => {
          conflict.eventIds.forEach((eventId) => {
            conflictMap[eventId] = conflict.message;
          });
        });

        setEventConflicts(conflictMap);
        setPendingConflicts(result.conflicts);
        setShowSaveConfirmDialog(true);
        return null;
      } else {
        clearEventConflicts();
        applyChanges();
        toast({
          title: 'Changes saved',
          description: 'Your itinerary has been updated.',
        });
        return itineraryToValidate;
      }
    } catch (error) {
      console.error('Validation error:', error);
      applyChanges();
      toast({
        title: 'Changes saved',
        description: 'Your itinerary has been updated.',
      });
      return itineraryToValidate;
    } finally {
      setIsValidating(false);
    }
  }, [
    itinerary,
    applyChanges,
    toast,
    setEventConflicts,
    clearEventConflicts,
    visualSelections,
    applyVisualSelections,
    debugLog,
  ]);

  // Confirm save with conflicts
  const handleConfirmSaveWithConflicts = useCallback(() => {
    setShowSaveConfirmDialog(false);
    applyChanges();
    toast({
      title: 'Changes saved with warnings',
      description: `${pendingConflicts.length} conflict${pendingConflicts.length > 1 ? 's' : ''} remain. You can dismiss them individually.`,
    });
    setPendingConflicts([]);
  }, [applyChanges, toast, pendingConflicts.length]);

  // Cancel save
  const handleCancelSave = useCallback(() => {
    setShowSaveConfirmDialog(false);
    setPendingConflicts([]);
  }, []);

  // Dismiss conflict
  const handleDismissConflict = useCallback(
    (eventId: string) => {
      dismissEventConflict(eventId);
    },
    [dismissEventConflict]
  );

  // Dismiss warning
  const handleDismissWarning = useCallback(
    (warningId: string) => {
      dismissWarning(warningId);
    },
    [dismissWarning]
  );

  // Optimization
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

  const handleApplyOptimizations = useCallback(
    (optimizationIds: string[]) => {
      console.log('Applying optimizations:', optimizationIds);
      setShowOptimizationModal(false);
      applyChanges();
      toast({
        title: 'Changes saved',
        description: `Applied ${optimizationIds.length} optimization(s).`,
      });
    },
    [applyChanges, toast]
  );

  const handleSkipOptimizations = useCallback(() => {
    setShowOptimizationModal(false);
    applyChanges();
    toast({
      title: 'Changes saved',
      description: 'Your itinerary has been updated.',
    });
  }, [applyChanges, toast]);

  const handleCloseOptimizationModal = useCallback(() => {
    setShowOptimizationModal(false);
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    undo();
    toast({
      title: 'Undone',
      description: 'Last action has been reverted.',
    });
  }, [undo, toast]);

  return {
    // State
    isValidating,
    pendingConflicts,
    showSaveConfirmDialog,
    optimizations,
    showOptimizationModal,
    addEventDayNumber,
    addAlternativeEvent,
    editEventData,

    // Event handlers
    handleSelectEvent,
    handleDeleteEvent,
    handleDeleteSelected,
    handleMoveEvent,
    handleAddEvent,
    handleDragStart,

    // Alternatives
    handleOpenAddAlternative,
    handleCloseAddAlternative,
    handleAddAlternative,
    handleVisualSelectionChange,

    // Validation and conflicts
    handleApplyChanges,
    handleConfirmSaveWithConflicts,
    handleCancelSave,
    handleDismissConflict,
    handleDismissWarning,

    // Optimization
    handleOptimize,
    handleApplyOptimizations,
    handleSkipOptimizations,
    handleCloseOptimizationModal,

    // Undo
    handleUndo,

    // Edit event
    handleOpenEditEvent,
    handleCloseEditEvent,
    handleEditEvent,

    // Add event modal
    handleOpenAddEvent,
    handleCloseAddEvent,
  };
}

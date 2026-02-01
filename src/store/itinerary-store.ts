import { create } from 'zustand';
import { Itinerary, Day, Event, DayWarning, EventConflictMap } from '@/types';

// EventConflictMap is now imported from @/types/itinerary

interface ItineraryState {
  itinerary: Itinerary | null;
  selectedEventIds: string[];
  editMode: boolean;
  editSidebarOpen: boolean;
  undoStack: Itinerary[];
  hasUnsavedChanges: boolean;
  warnings: DayWarning[];
  eventConflicts: EventConflictMap;
  // Visual selections for alternative cycling (groupId -> visually selected eventId)
  visualSelections: Record<string, string>;
}

interface ItineraryActions {
  setItinerary: (itinerary: Itinerary) => void;
  updateDay: (dayNumber: number, day: Partial<Day>) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  reorderEvent: (dayNumber: number, eventId: string, newOrder: number) => void;
  addEvent: (dayNumber: number, event: Event) => void;
  deleteEvent: (dayNumber: number, eventId: string) => void;
  selectEvent: (eventId: string) => void;
  deselectEvent: (eventId: string) => void;
  toggleEventSelection: (eventId: string) => void;
  clearSelection: () => void;
  toggleEditMode: () => void;
  setEditSidebarOpen: (open: boolean) => void;
  pushUndo: () => void;
  undo: () => void;
  canUndo: () => boolean;
  applyChanges: () => void;
  // Warnings
  setWarnings: (warnings: DayWarning[]) => void;
  dismissWarning: (warningId: string) => void;
  clearWarnings: () => void;
  // Event Conflicts
  setEventConflicts: (conflicts: EventConflictMap) => void;
  dismissEventConflict: (eventId: string) => void;
  clearEventConflicts: () => void;
  // Alternatives
  addAlternative: (dayNumber: number, primaryEventId: string, alternativeEvent: Event) => void;
  promoteAlternative: (dayNumber: number, eventId: string) => void;
  removeAlternative: (dayNumber: number, eventId: string) => void;
  // Visual selections for cycling
  setVisualSelection: (groupId: string, eventId: string) => void;
  clearVisualSelections: () => void;
  applyVisualSelections: () => void;
  reset: () => void;
}

const initialState: ItineraryState = {
  itinerary: null,
  selectedEventIds: [],
  editMode: false,
  editSidebarOpen: false,
  undoStack: [],
  hasUnsavedChanges: false,
  warnings: [],
  eventConflicts: {},
  visualSelections: {},
};

export const useItineraryStore = create<ItineraryState & ItineraryActions>((set, get) => ({
  ...initialState,

  setItinerary: (itinerary) => set({ itinerary, undoStack: [], hasUnsavedChanges: false }),

  updateDay: (dayNumber, dayUpdate) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) =>
        day.day_number === dayNumber ? { ...day, ...dayUpdate } : day
      );

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  moveEvent: (eventId, fromDay, toDay, newIndex) =>
    set((state) => {
      if (!state.itinerary) return state;

      // Find the event and check if it has alternatives
      const fromDayData = state.itinerary.days.find((d) => d.day_number === fromDay);
      if (!fromDayData) return state;

      const targetEvent = fromDayData.events.find((e) => e.id === eventId);
      if (!targetEvent) return state;

      // Get all events in the same alternative group (if any)
      const groupId = targetEvent.alternativeGroupId;
      const eventsToMove = groupId
        ? fromDayData.events.filter((e) => e.alternativeGroupId === groupId)
        : [targetEvent];
      const eventIdsToMove = eventsToMove.map((e) => e.id);

      // If same day, treat as reorder
      if (fromDay === toDay) {
        if (newIndex === undefined) return state;

        const events = [...fromDayData.events];
        // Remove all events in the group
        const remainingEvents = events.filter((e) => !eventIdsToMove.includes(e.id));
        // Insert at new position
        remainingEvents.splice(newIndex, 0, ...eventsToMove);

        const updatedDays = state.itinerary.days.map((d) =>
          d.day_number === fromDay
            ? { ...d, events: remainingEvents.map((e, idx) => ({ ...e, order: idx })) }
            : d
        );

        return {
          itinerary: { ...state.itinerary, days: updatedDays },
          hasUnsavedChanges: true,
        };
      }

      // Moving to different day
      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number === fromDay) {
          // Remove events from source day
          return {
            ...day,
            events: day.events
              .filter((e) => !eventIdsToMove.includes(e.id))
              .map((e, idx) => ({ ...e, order: idx })),
          };
        }
        if (day.day_number === toDay) {
          // Add events to target day
          const events = [...day.events];
          const insertIndex = newIndex !== undefined ? newIndex : events.length;
          events.splice(insertIndex, 0, ...eventsToMove);
          return {
            ...day,
            events: events.map((e, idx) => ({ ...e, order: idx })),
          };
        }
        return day;
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  reorderEvent: (dayNumber, eventId, newOrder) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        const events = [...day.events];
        const currentIndex = events.findIndex((e) => e.id === eventId);
        if (currentIndex === -1) return day;

        const [event] = events.splice(currentIndex, 1);
        events.splice(newOrder, 0, event);

        return {
          ...day,
          events: events.map((e, index) => ({ ...e, order: index })),
        };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  addEvent: (dayNumber, event) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        const newEvent = { ...event, order: day.events.length };
        return {
          ...day,
          events: [...day.events, newEvent],
        };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  deleteEvent: (dayNumber, eventId) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        return {
          ...day,
          events: day.events
            .filter((e) => e.id !== eventId)
            .map((e, index) => ({ ...e, order: index })),
        };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        selectedEventIds: state.selectedEventIds.filter((id) => id !== eventId),
        hasUnsavedChanges: true,
      };
    }),

  selectEvent: (eventId) =>
    set((state) => ({
      selectedEventIds: state.selectedEventIds.includes(eventId)
        ? state.selectedEventIds
        : [...state.selectedEventIds, eventId],
    })),

  deselectEvent: (eventId) =>
    set((state) => ({
      selectedEventIds: state.selectedEventIds.filter((id) => id !== eventId),
    })),

  toggleEventSelection: (eventId) =>
    set((state) => ({
      selectedEventIds: state.selectedEventIds.includes(eventId)
        ? state.selectedEventIds.filter((id) => id !== eventId)
        : [...state.selectedEventIds, eventId],
    })),

  clearSelection: () => set({ selectedEventIds: [] }),

  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),

  setEditSidebarOpen: (open) => set({ editSidebarOpen: open }),

  pushUndo: () =>
    set((state) => {
      if (!state.itinerary) return state;
      return {
        undoStack: [...state.undoStack, JSON.parse(JSON.stringify(state.itinerary))],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state;

      const newStack = [...state.undoStack];
      const previousItinerary = newStack.pop();

      return {
        itinerary: previousItinerary || state.itinerary,
        undoStack: newStack,
        hasUnsavedChanges: newStack.length > 0,
      };
    }),

  canUndo: () => get().undoStack.length > 0,

  applyChanges: () =>
    set(() => ({
      undoStack: [],
      hasUnsavedChanges: false,
    })),

  // Warnings
  setWarnings: (warnings) => set({ warnings }),

  dismissWarning: (warningId) =>
    set((state) => ({
      warnings: state.warnings.filter((w) => w.id !== warningId),
    })),

  clearWarnings: () => set({ warnings: [] }),

  // Event Conflicts
  setEventConflicts: (conflicts) => set({ eventConflicts: conflicts }),

  dismissEventConflict: (eventId) =>
    set((state) => {
      const newConflicts = { ...state.eventConflicts };
      delete newConflicts[eventId];
      return { eventConflicts: newConflicts };
    }),

  clearEventConflicts: () => set({ eventConflicts: {} }),

  // Alternatives
  addAlternative: (dayNumber, primaryEventId, alternativeEvent) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        // Find the primary event
        const primaryEvent = day.events.find((e) => e.id === primaryEventId);
        if (!primaryEvent) return day;

        // Create or use existing group ID
        const groupId = primaryEvent.alternativeGroupId || `alt_group_${Date.now()}`;

        // Update primary event with group ID if it doesn't have one
        const updatedEvents = day.events.map((e) => {
          if (e.id === primaryEventId) {
            return { ...e, alternativeGroupId: groupId, isPrimaryAlternative: true };
          }
          return e;
        });

        // Add the alternative event with the same group ID and same order as primary
        const newAlternative: Event = {
          ...alternativeEvent,
          alternativeGroupId: groupId,
          isPrimaryAlternative: false,
          order: primaryEvent.order, // Keep same order as primary so it stays in position
        };

        // Insert the alternative right after the primary event
        const primaryIndex = updatedEvents.findIndex((e) => e.id === primaryEventId);
        const eventsWithAlternative = [
          ...updatedEvents.slice(0, primaryIndex + 1),
          newAlternative,
          ...updatedEvents.slice(primaryIndex + 1),
        ];

        return {
          ...day,
          events: eventsWithAlternative,
        };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  promoteAlternative: (dayNumber, eventId) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        // Find the event to promote
        const eventToPromote = day.events.find((e) => e.id === eventId);
        if (!eventToPromote || !eventToPromote.alternativeGroupId) return day;

        const groupId = eventToPromote.alternativeGroupId;

        // Update all events in the group
        const updatedEvents = day.events.map((e) => {
          if (e.alternativeGroupId === groupId) {
            return {
              ...e,
              isPrimaryAlternative: e.id === eventId,
            };
          }
          return e;
        });

        return { ...day, events: updatedEvents };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        hasUnsavedChanges: true,
      };
    }),

  removeAlternative: (dayNumber, eventId) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number !== dayNumber) return day;

        // Find the event to remove
        const eventToRemove = day.events.find((e) => e.id === eventId);
        if (!eventToRemove) return day;

        const groupId = eventToRemove.alternativeGroupId;

        // If it's a primary alternative, we need to promote another one
        if (eventToRemove.isPrimaryAlternative && groupId) {
          const otherAlternatives = day.events.filter(
            (e) => e.alternativeGroupId === groupId && e.id !== eventId
          );

          if (otherAlternatives.length > 0) {
            // Promote the first alternative
            const newPrimary = otherAlternatives[0];
            const updatedEvents = day.events
              .filter((e) => e.id !== eventId)
              .map((e) => {
                if (e.id === newPrimary.id) {
                  return { ...e, isPrimaryAlternative: true };
                }
                // If only one left, remove the group
                if (e.alternativeGroupId === groupId && otherAlternatives.length === 1) {
                  return { ...e, alternativeGroupId: undefined, isPrimaryAlternative: undefined };
                }
                return e;
              })
              .map((e, idx) => ({ ...e, order: idx }));

            return { ...day, events: updatedEvents };
          }
        }

        // Just remove the event
        const updatedEvents = day.events
          .filter((e) => e.id !== eventId)
          .map((e, idx) => ({ ...e, order: idx }));

        // If only one event left in group, remove group ID
        if (groupId) {
          const remainingInGroup = updatedEvents.filter((e) => e.alternativeGroupId === groupId);
          if (remainingInGroup.length === 1) {
            return {
              ...day,
              events: updatedEvents.map((e) =>
                e.alternativeGroupId === groupId
                  ? { ...e, alternativeGroupId: undefined, isPrimaryAlternative: undefined }
                  : e
              ),
            };
          }
        }

        return { ...day, events: updatedEvents };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        selectedEventIds: state.selectedEventIds.filter((id) => id !== eventId),
        hasUnsavedChanges: true,
      };
    }),

  // Visual selections for cycling (doesn't change store data until applyVisualSelections)
  setVisualSelection: (groupId, eventId) =>
    set((state) => ({
      visualSelections: { ...state.visualSelections, [groupId]: eventId },
    })),

  clearVisualSelections: () => set({ visualSelections: {} }),

  applyVisualSelections: () =>
    set((state) => {
      if (!state.itinerary || Object.keys(state.visualSelections).length === 0) {
        return { visualSelections: {} };
      }

      // For each visual selection, promote that alternative
      const updatedDays = state.itinerary.days.map((day) => {
        let updatedEvents = [...day.events];

        Object.entries(state.visualSelections).forEach(([groupId, selectedEventId]) => {
          // Check if this day has events with this groupId
          const groupEvents = updatedEvents.filter((e) => e.alternativeGroupId === groupId);
          if (groupEvents.length === 0) return;

          // Update isPrimaryAlternative flags
          updatedEvents = updatedEvents.map((e) => {
            if (e.alternativeGroupId === groupId) {
              return {
                ...e,
                isPrimaryAlternative: e.id === selectedEventId,
              };
            }
            return e;
          });
        });

        return { ...day, events: updatedEvents };
      });

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
        visualSelections: {},
        hasUnsavedChanges: true,
      };
    }),

  reset: () => set(initialState),
}));

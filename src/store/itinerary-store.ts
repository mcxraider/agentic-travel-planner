import { create } from 'zustand';
import { Itinerary, Day, Event } from '@/types';

interface ItineraryState {
  itinerary: Itinerary | null;
  selectedEventIds: string[];
  editMode: boolean;
  editSidebarOpen: boolean;
  undoStack: Itinerary[];
  hasUnsavedChanges: boolean;
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
  reset: () => void;
}

const initialState: ItineraryState = {
  itinerary: null,
  selectedEventIds: [],
  editMode: false,
  editSidebarOpen: false,
  undoStack: [],
  hasUnsavedChanges: false,
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

      // If same day, treat as reorder
      if (fromDay === toDay) {
        if (newIndex === undefined) return state;
        const day = state.itinerary.days.find((d) => d.day_number === fromDay);
        if (!day) return state;

        const events = [...day.events];
        const currentIndex = events.findIndex((e) => e.id === eventId);
        if (currentIndex === -1) return state;

        const [event] = events.splice(currentIndex, 1);
        events.splice(newIndex, 0, event);

        const updatedDays = state.itinerary.days.map((d) =>
          d.day_number === fromDay
            ? { ...d, events: events.map((e, idx) => ({ ...e, order: idx })) }
            : d
        );

        return {
          itinerary: { ...state.itinerary, days: updatedDays },
          hasUnsavedChanges: true,
        };
      }

      let movedEvent: Event | null = null;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number === fromDay) {
          const eventIndex = day.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1) {
            movedEvent = day.events[eventIndex];
            return {
              ...day,
              events: day.events.filter((e) => e.id !== eventId).map((e, idx) => ({ ...e, order: idx })),
            };
          }
        }
        return day;
      });

      if (movedEvent) {
        const finalDays = updatedDays.map((day) => {
          if (day.day_number === toDay) {
            const events = [...day.events];
            const insertIndex = newIndex !== undefined ? newIndex : events.length;
            events.splice(insertIndex, 0, { ...movedEvent!, order: insertIndex });
            return {
              ...day,
              events: events.map((e, idx) => ({ ...e, order: idx })),
            };
          }
          return day;
        });

        return {
          itinerary: { ...state.itinerary, days: finalDays },
          hasUnsavedChanges: true,
        };
      }

      return state;
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

  reset: () => set(initialState),
}));

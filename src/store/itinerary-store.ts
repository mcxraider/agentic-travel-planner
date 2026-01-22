import { create } from 'zustand';
import { Itinerary, Day, Event } from '@/types';

interface ItineraryState {
  itinerary: Itinerary | null;
  selectedEventIds: string[];
  editMode: boolean;
  editSidebarOpen: boolean;
}

interface ItineraryActions {
  setItinerary: (itinerary: Itinerary) => void;
  updateDay: (dayNumber: number, day: Partial<Day>) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number) => void;
  reorderEvent: (dayNumber: number, eventId: string, newOrder: number) => void;
  selectEvent: (eventId: string) => void;
  deselectEvent: (eventId: string) => void;
  clearSelection: () => void;
  toggleEditMode: () => void;
  setEditSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState: ItineraryState = {
  itinerary: null,
  selectedEventIds: [],
  editMode: false,
  editSidebarOpen: false,
};

export const useItineraryStore = create<ItineraryState & ItineraryActions>((set) => ({
  ...initialState,

  setItinerary: (itinerary) => set({ itinerary }),

  updateDay: (dayNumber, dayUpdate) =>
    set((state) => {
      if (!state.itinerary) return state;

      const updatedDays = state.itinerary.days.map((day) =>
        day.day_number === dayNumber ? { ...day, ...dayUpdate } : day
      );

      return {
        itinerary: { ...state.itinerary, days: updatedDays },
      };
    }),

  moveEvent: (eventId, fromDay, toDay) =>
    set((state) => {
      if (!state.itinerary || fromDay === toDay) return state;

      let movedEvent: Event | null = null;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.day_number === fromDay) {
          const eventIndex = day.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1) {
            movedEvent = day.events[eventIndex];
            return {
              ...day,
              events: day.events.filter((e) => e.id !== eventId),
            };
          }
        }
        return day;
      });

      if (movedEvent) {
        const finalDays = updatedDays.map((day) => {
          if (day.day_number === toDay) {
            return {
              ...day,
              events: [...day.events, { ...movedEvent!, order: day.events.length }],
            };
          }
          return day;
        });

        return {
          itinerary: { ...state.itinerary, days: finalDays },
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

  clearSelection: () => set({ selectedEventIds: [] }),

  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),

  setEditSidebarOpen: (open) => set({ editSidebarOpen: open }),

  reset: () => set(initialState),
}));

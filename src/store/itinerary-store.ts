import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Itinerary, Day, Event, DayWarning, EventConflictMap } from '@/types';
import { recalculateEventTimes } from '@/lib/utils';

interface ItineraryState {
  itinerary: Itinerary | null;
  itinerariesByTripId: Record<string, Itinerary>;
  selectedEventIds: string[];
  editMode: boolean;
  editSidebarOpen: boolean;
  undoStack: Itinerary[];
  hasUnsavedChanges: boolean;
  warnings: DayWarning[];
  eventConflicts: EventConflictMap;
  visualSelections: Record<string, string>;
  currentVersion: number | null;
  currentVersionByTripId: Record<string, number>;
}

interface ItineraryActions {
  setItinerary: (itinerary: Itinerary) => void;
  loadItinerary: (tripId: string) => Itinerary | null;
  updateDay: (dayNumber: number, day: Partial<Day>) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  reorderEvent: (dayNumber: number, eventId: string, newOrder: number) => void;
  addEvent: (dayNumber: number, event: Event) => void;
  editEvent: (dayNumber: number, eventId: string, updatedFields: Partial<Event>) => void;
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
  setWarnings: (warnings: DayWarning[]) => void;
  dismissWarning: (warningId: string) => void;
  clearWarnings: () => void;
  setEventConflicts: (conflicts: EventConflictMap) => void;
  dismissEventConflict: (eventId: string) => void;
  clearEventConflicts: () => void;
  addAlternative: (dayNumber: number, primaryEventId: string, alternativeEvent: Event) => void;
  promoteAlternative: (dayNumber: number, eventId: string) => void;
  removeAlternative: (dayNumber: number, eventId: string) => void;
  setVisualSelection: (groupId: string, eventId: string) => void;
  clearVisualSelections: () => void;
  applyVisualSelections: () => void;
  setCurrentVersion: (version: number) => void;
  reset: () => void;
}

const cloneItinerary = (itinerary: Itinerary): Itinerary =>
  JSON.parse(JSON.stringify(itinerary)) as Itinerary;

const withPersistedItinerary = (
  state: Pick<ItineraryState, 'itinerariesByTripId' | 'currentVersionByTripId'>,
  itinerary: Itinerary,
  extraState: Partial<ItineraryState> = {}
): Partial<ItineraryState> => ({
  itinerary,
  itinerariesByTripId: {
    ...state.itinerariesByTripId,
    [itinerary.trip_id]: cloneItinerary(itinerary),
  },
  currentVersion:
    extraState.currentVersion ?? state.currentVersionByTripId[itinerary.trip_id] ?? null,
  ...extraState,
});

const initialState: ItineraryState = {
  itinerary: null,
  itinerariesByTripId: {},
  selectedEventIds: [],
  editMode: false,
  editSidebarOpen: false,
  undoStack: [],
  hasUnsavedChanges: false,
  warnings: [],
  eventConflicts: {},
  visualSelections: {},
  currentVersion: null,
  currentVersionByTripId: {},
};

export const useItineraryStore = create<ItineraryState & ItineraryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setItinerary: (itinerary) =>
        set((state) => ({
          ...withPersistedItinerary(state, itinerary, {
            undoStack: [],
            hasUnsavedChanges: false,
            selectedEventIds: [],
            warnings: [],
            eventConflicts: {},
            visualSelections: {},
          }),
        })),

      loadItinerary: (tripId) => {
        const itinerary = get().itinerariesByTripId[tripId] ?? null;
        if (itinerary) {
          set((state) => ({
            ...withPersistedItinerary(state, cloneItinerary(itinerary), {
              undoStack: [],
              hasUnsavedChanges: false,
              selectedEventIds: [],
              warnings: [],
              eventConflicts: {},
              visualSelections: {},
            }),
          }));
        }
        return itinerary;
      },

      updateDay: (dayNumber, dayUpdate) =>
        set((state) => {
          if (!state.itinerary) return state;

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: state.itinerary.days.map((day) =>
              day.day_number === dayNumber ? { ...day, ...dayUpdate } : day
            ),
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            hasUnsavedChanges: true,
          };
        }),

      moveEvent: (eventId, fromDay, toDay, newIndex) =>
        set((state) => {
          if (!state.itinerary) return state;

          const fromDayData = state.itinerary.days.find((day) => day.day_number === fromDay);
          if (!fromDayData) return state;

          const targetEvent = fromDayData.events.find((event) => event.id === eventId);
          if (!targetEvent) return state;

          const groupId = targetEvent.alternativeGroupId;
          const eventsToMove = groupId
            ? fromDayData.events.filter((event) => event.alternativeGroupId === groupId)
            : [targetEvent];
          const eventIdsToMove = eventsToMove.map((event) => event.id);

          if (fromDay === toDay) {
            if (newIndex === undefined) return state;

            const originalEvents = [...fromDayData.events];
            const remainingEvents = originalEvents.filter(
              (event) => !eventIdsToMove.includes(event.id)
            );
            remainingEvents.splice(newIndex, 0, ...eventsToMove);

            const reorderedEvents = remainingEvents.map((event, index) => ({
              ...event,
              order: index,
            }));

            const oldPrimaryIndex = originalEvents
              .filter((event) => !event.alternativeGroupId || event.isPrimaryAlternative !== false)
              .findIndex((event) => eventIdsToMove.includes(event.id));
            const startIndex = Math.min(oldPrimaryIndex >= 0 ? oldPrimaryIndex : 0, newIndex);

            const recalculated = recalculateEventTimes(originalEvents, reorderedEvents, startIndex);

            const nextItinerary: Itinerary = {
              ...state.itinerary,
              days: state.itinerary.days.map((day) =>
                day.day_number === fromDay ? { ...day, events: recalculated } : day
              ),
            };

            return {
              ...withPersistedItinerary(state, nextItinerary),
              hasUnsavedChanges: true,
            };
          }

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number === fromDay) {
              return {
                ...day,
                events: day.events
                  .filter((event) => !eventIdsToMove.includes(event.id))
                  .map((event, index) => ({ ...event, order: index })),
              };
            }

            if (day.day_number === toDay) {
              const originalTargetEvents = [...day.events];
              const events = [...day.events];
              const insertIndex = newIndex !== undefined ? newIndex : events.length;
              events.splice(insertIndex, 0, ...eventsToMove);
              const reorderedEvents = events.map((event, index) => ({
                ...event,
                order: index,
              }));

              if (originalTargetEvents.length > 0) {
                const recalculated = recalculateEventTimes(
                  originalTargetEvents,
                  reorderedEvents,
                  insertIndex
                );
                return { ...day, events: recalculated };
              }

              return { ...day, events: reorderedEvents };
            }

            return day;
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            hasUnsavedChanges: true,
          };
        }),

      reorderEvent: (dayNumber, eventId, newOrder) =>
        set((state) => {
          if (!state.itinerary) return state;

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number !== dayNumber) return day;

            const events = [...day.events];
            const currentIndex = events.findIndex((event) => event.id === eventId);
            if (currentIndex === -1) return day;

            const [event] = events.splice(currentIndex, 1);
            events.splice(newOrder, 0, event);

            return {
              ...day,
              events: events.map((item, index) => ({ ...item, order: index })),
            };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
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

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            hasUnsavedChanges: true,
          };
        }),

      editEvent: (dayNumber, eventId, updatedFields) =>
        set((state) => {
          if (!state.itinerary) return state;

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number !== dayNumber) return day;

            return {
              ...day,
              events: day.events.map((event) =>
                event.id === eventId ? { ...event, ...updatedFields } : event
              ),
            };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
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
                .filter((event) => event.id !== eventId)
                .map((event, index) => ({ ...event, order: index })),
            };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
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
            undoStack: [...state.undoStack, cloneItinerary(state.itinerary)],
          };
        }),

      undo: () =>
        set((state) => {
          if (state.undoStack.length === 0) return state;

          const newStack = [...state.undoStack];
          const previousItinerary = newStack.pop();
          if (!previousItinerary) return state;

          return {
            ...withPersistedItinerary(state, previousItinerary),
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

      setWarnings: (warnings) => set({ warnings }),

      dismissWarning: (warningId) =>
        set((state) => ({
          warnings: state.warnings.filter((warning) => warning.id !== warningId),
        })),

      clearWarnings: () => set({ warnings: [] }),

      setEventConflicts: (conflicts) => set({ eventConflicts: conflicts }),

      dismissEventConflict: (eventId) =>
        set((state) => {
          const nextConflicts = { ...state.eventConflicts };
          delete nextConflicts[eventId];
          return { eventConflicts: nextConflicts };
        }),

      clearEventConflicts: () => set({ eventConflicts: {} }),

      addAlternative: (dayNumber, primaryEventId, alternativeEvent) =>
        set((state) => {
          if (!state.itinerary) return state;

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number !== dayNumber) return day;

            const primaryEvent = day.events.find((event) => event.id === primaryEventId);
            if (!primaryEvent) return day;

            const groupId = primaryEvent.alternativeGroupId || `alt_group_${Date.now()}`;

            const updatedEvents = day.events.map((event) => {
              if (event.id === primaryEventId) {
                return { ...event, alternativeGroupId: groupId, isPrimaryAlternative: true };
              }
              return event;
            });

            const newAlternative: Event = {
              ...alternativeEvent,
              alternativeGroupId: groupId,
              isPrimaryAlternative: false,
              order: primaryEvent.order,
            };

            const primaryIndex = updatedEvents.findIndex((event) => event.id === primaryEventId);
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

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            hasUnsavedChanges: true,
          };
        }),

      promoteAlternative: (dayNumber, eventId) =>
        set((state) => {
          if (!state.itinerary) return state;

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number !== dayNumber) return day;

            const eventToPromote = day.events.find((event) => event.id === eventId);
            if (!eventToPromote || !eventToPromote.alternativeGroupId) return day;

            const groupId = eventToPromote.alternativeGroupId;

            return {
              ...day,
              events: day.events.map((event) =>
                event.alternativeGroupId === groupId
                  ? { ...event, isPrimaryAlternative: event.id === eventId }
                  : event
              ),
            };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            hasUnsavedChanges: true,
          };
        }),

      removeAlternative: (dayNumber, eventId) =>
        set((state) => {
          if (!state.itinerary) return state;

          const updatedDays = state.itinerary.days.map((day) => {
            if (day.day_number !== dayNumber) return day;

            const eventToRemove = day.events.find((event) => event.id === eventId);
            if (!eventToRemove) return day;

            const groupId = eventToRemove.alternativeGroupId;

            if (eventToRemove.isPrimaryAlternative && groupId) {
              const otherAlternatives = day.events.filter(
                (event) => event.alternativeGroupId === groupId && event.id !== eventId
              );

              if (otherAlternatives.length > 0) {
                const newPrimary = otherAlternatives[0];
                const updatedEvents = day.events
                  .filter((event) => event.id !== eventId)
                  .map((event) => {
                    if (event.id === newPrimary.id) {
                      return { ...event, isPrimaryAlternative: true };
                    }

                    if (event.alternativeGroupId === groupId && otherAlternatives.length === 1) {
                      return {
                        ...event,
                        alternativeGroupId: undefined,
                        isPrimaryAlternative: undefined,
                      };
                    }

                    return event;
                  })
                  .map((event, index) => ({ ...event, order: index }));

                return { ...day, events: updatedEvents };
              }
            }

            const updatedEvents = day.events
              .filter((event) => event.id !== eventId)
              .map((event, index) => ({ ...event, order: index }));

            if (groupId) {
              const remainingInGroup = updatedEvents.filter(
                (event) => event.alternativeGroupId === groupId
              );
              if (remainingInGroup.length === 1) {
                return {
                  ...day,
                  events: updatedEvents.map((event) =>
                    event.alternativeGroupId === groupId
                      ? {
                          ...event,
                          alternativeGroupId: undefined,
                          isPrimaryAlternative: undefined,
                        }
                      : event
                  ),
                };
              }
            }

            return { ...day, events: updatedEvents };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            selectedEventIds: state.selectedEventIds.filter((id) => id !== eventId),
            hasUnsavedChanges: true,
          };
        }),

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

          const updatedDays = state.itinerary.days.map((day) => {
            let updatedEvents = [...day.events];

            Object.entries(state.visualSelections).forEach(([groupId, selectedEventId]) => {
              const groupEvents = updatedEvents.filter(
                (event) => event.alternativeGroupId === groupId
              );
              if (groupEvents.length === 0) return;

              updatedEvents = updatedEvents.map((event) =>
                event.alternativeGroupId === groupId
                  ? {
                      ...event,
                      isPrimaryAlternative: event.id === selectedEventId,
                    }
                  : event
              );
            });

            return { ...day, events: updatedEvents };
          });

          const nextItinerary: Itinerary = {
            ...state.itinerary,
            days: updatedDays,
          };

          return {
            ...withPersistedItinerary(state, nextItinerary),
            visualSelections: {},
            hasUnsavedChanges: true,
          };
        }),

      setCurrentVersion: (version) =>
        set((state) => ({
          currentVersion: version,
          currentVersionByTripId: state.itinerary
            ? {
                ...state.currentVersionByTripId,
                [state.itinerary.trip_id]: version,
              }
            : state.currentVersionByTripId,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'itinerary-storage',
      partialize: (state) => ({
        itinerary: state.itinerary,
        itinerariesByTripId: state.itinerariesByTripId,
        currentVersion: state.currentVersion,
        currentVersionByTripId: state.currentVersionByTripId,
      }),
    }
  )
);

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Itinerary, Event, DayWarning, EventConflictMap } from '@/types';

/**
 * Context value interface for itinerary state and actions.
 * Provides all necessary data and callbacks for TimelineView, DayCard, and EventCard components.
 */
export interface ItineraryContextValue {
  // State
  itinerary: Itinerary | null;
  selectedEventIds: string[];
  eventConflicts: EventConflictMap;
  visualSelections: Record<string, string>;
  warnings: DayWarning[];
  hasUnsavedChanges: boolean;
  canUndo: boolean;

  // Event actions
  selectEvent: (eventId: string, multiSelect: boolean) => void;
  deleteEvent: (dayNumber: number, eventId: string) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;

  // Modal triggers (opens the add event/alternative/edit forms)
  openAddEvent: (dayNumber: number) => void;
  openAddAlternative: (dayNumber: number, event: Event) => void;
  openEditEvent: (dayNumber: number, event: Event) => void;

  // Visual selection for cycling through alternatives
  cycleAlternative: (groupId: string, eventId: string) => void;

  // Dismiss actions
  dismissConflict: (eventId: string) => void;
  dismissWarning: (warningId: string) => void;

  // Drag-drop
  onDragStart: () => void;
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

interface ItineraryProviderProps {
  children: ReactNode;
  value: ItineraryContextValue;
}

/**
 * Provider component that wraps the itinerary component tree.
 * Eliminates prop drilling by providing state and actions via context.
 *
 * @example
 * <ItineraryProvider value={contextValue}>
 *   <TimelineView />
 * </ItineraryProvider>
 */
export function ItineraryProvider({ children, value }: ItineraryProviderProps) {
  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
}

/**
 * Hook to access itinerary context.
 * Returns null if not within ItineraryProvider, allowing optional context usage.
 *
 * @example
 * const context = useItineraryContext();
 * if (context) {
 *   // Use context values
 * }
 */
export function useItineraryContext(): ItineraryContextValue | null {
  return useContext(ItineraryContext);
}

/**
 * Hook to access itinerary context with required check.
 * Throws if not within ItineraryProvider.
 *
 * @example
 * const { itinerary, selectEvent } = useItinerary();
 */
export function useItinerary(): ItineraryContextValue {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within ItineraryProvider');
  }
  return context;
}

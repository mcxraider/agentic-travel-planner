'use client';

import { Itinerary, Event, DayWarning, EventConflictMap } from '@/types';
import { useItineraryContext } from '@/contexts';
import { DragDropContext } from './DragDropContext';
import { DayCard } from './DayCard';

interface TimelineViewProps {
  // These props are optional when using ItineraryProvider
  itinerary?: Itinerary;
  selectedEventIds?: string[];
  warnings?: DayWarning[];
  eventConflicts?: EventConflictMap;
  visualSelections?: Record<string, string>;
  onSelectEvent?: (eventId: string, multiSelect: boolean) => void;
  onDeleteEvent?: (dayNumber: number, eventId: string) => void;
  onMoveEvent?: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  onAddEvent?: (dayNumber: number) => void;
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  onDismissWarning?: (warningId: string) => void;
  onDismissConflict?: (eventId: string) => void;
  onDragStart?: () => void;
}

/**
 * TimelineView component that displays the itinerary as a list of day cards.
 *
 * Supports two usage patterns:
 * 1. Context-based (recommended): Wrap with ItineraryProvider, no props needed
 * 2. Prop-based (legacy): Pass all required props directly
 *
 * @example Context-based usage:
 * <ItineraryProvider value={contextValue}>
 *   <TimelineView />
 * </ItineraryProvider>
 *
 * @example Prop-based usage (backward compatible):
 * <TimelineView
 *   itinerary={itinerary}
 *   selectedEventIds={selectedEventIds}
 *   onSelectEvent={handleSelectEvent}
 *   // ... other props
 * />
 */
export function TimelineView({
  itinerary: propItinerary,
  selectedEventIds: propSelectedEventIds,
  warnings: propWarnings = [],
  eventConflicts: propEventConflicts = {},
  visualSelections: propVisualSelections = {},
  onSelectEvent: propOnSelectEvent,
  onDeleteEvent: propOnDeleteEvent,
  onMoveEvent: propOnMoveEvent,
  onAddEvent: propOnAddEvent,
  onAddAlternative: propOnAddAlternative,
  onVisualSelectionChange: propOnVisualSelectionChange,
  onDismissWarning: propOnDismissWarning,
  onDismissConflict: propOnDismissConflict,
  onDragStart: propOnDragStart,
}: TimelineViewProps) {
  // Try to get values from context, fall back to props
  const context = useItineraryContext();

  // Resolve values: context takes precedence, then props
  const itinerary = context?.itinerary ?? propItinerary;
  const selectedEventIds = context?.selectedEventIds ?? propSelectedEventIds ?? [];
  const warnings = context?.warnings ?? propWarnings;
  const eventConflicts = context?.eventConflicts ?? propEventConflicts;
  const visualSelections = context?.visualSelections ?? propVisualSelections;

  // Resolve callbacks: context takes precedence, then props
  const onSelectEvent = context?.selectEvent ?? propOnSelectEvent;
  const onDeleteEvent = context?.deleteEvent ?? propOnDeleteEvent;
  // Provide a no-op fallback for moveEvent since DragDropContext requires it
  const onMoveEvent = context?.moveEvent ?? propOnMoveEvent ?? (() => {});
  const onAddEvent = context?.openAddEvent ?? propOnAddEvent;
  const onAddAlternative = context?.openAddAlternative ?? propOnAddAlternative;
  const onVisualSelectionChange = context?.cycleAlternative ?? propOnVisualSelectionChange;
  const onDismissWarning = context?.dismissWarning ?? propOnDismissWarning;
  const onDismissConflict = context?.dismissConflict ?? propOnDismissConflict;
  const onDragStart = context?.onDragStart ?? propOnDragStart;

  if (!itinerary) {
    return null;
  }

  const sortedDays = [...itinerary.days].sort((a, b) => a.day_number - b.day_number);

  return (
    <DragDropContext onMoveEvent={onMoveEvent} onDragStart={onDragStart}>
      <div className="space-y-4 pb-8">
        {sortedDays.map((day) => (
          <DayCard
            key={day.day_number}
            day={day}
            selectedEventIds={selectedEventIds}
            visualSelections={visualSelections}
            onSelectEvent={onSelectEvent}
            onDeleteEvent={onDeleteEvent}
            onAddEvent={onAddEvent}
            onAddAlternative={onAddAlternative}
            onVisualSelectionChange={onVisualSelectionChange}
            warnings={warnings.filter((w) => w.dayNumber === day.day_number)}
            onDismissWarning={onDismissWarning}
            eventConflicts={eventConflicts}
            onDismissConflict={onDismissConflict}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

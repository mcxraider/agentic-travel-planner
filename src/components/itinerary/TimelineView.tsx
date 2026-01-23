'use client';

import { Itinerary, Event, DayWarning } from '@/types';
import { EventConflictMap } from '@/store/itinerary-store';
import { DragDropContext } from './DragDropContext';
import { DayCard } from './DayCard';

interface TimelineViewProps {
  itinerary: Itinerary;
  selectedEventIds: string[];
  warnings?: DayWarning[];
  eventConflicts?: EventConflictMap;
  visualSelections?: Record<string, string>;
  onSelectEvent: (eventId: string, multiSelect: boolean) => void;
  onDeleteEvent: (dayNumber: number, eventId: string) => void;
  onMoveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  onAddEvent: (dayNumber: number) => void;
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  onDismissWarning?: (warningId: string) => void;
  onDismissConflict?: (eventId: string) => void;
  onDragStart?: () => void;
}

export function TimelineView({
  itinerary,
  selectedEventIds,
  warnings = [],
  eventConflicts = {},
  visualSelections = {},
  onSelectEvent,
  onDeleteEvent,
  onMoveEvent,
  onAddEvent,
  onAddAlternative,
  onVisualSelectionChange,
  onDismissWarning,
  onDismissConflict,
  onDragStart,
}: TimelineViewProps) {
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

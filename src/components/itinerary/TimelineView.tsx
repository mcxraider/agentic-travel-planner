'use client';

import { Itinerary } from '@/types';
import { DragDropContext } from './DragDropContext';
import { DayCard } from './DayCard';

interface TimelineViewProps {
  itinerary: Itinerary;
  selectedEventIds: string[];
  onSelectEvent: (eventId: string, multiSelect: boolean) => void;
  onDeleteEvent: (dayNumber: number, eventId: string) => void;
  onMoveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  onAddEvent: (dayNumber: number) => void;
  onDragStart?: () => void;
}

export function TimelineView({
  itinerary,
  selectedEventIds,
  onSelectEvent,
  onDeleteEvent,
  onMoveEvent,
  onAddEvent,
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
            onSelectEvent={onSelectEvent}
            onDeleteEvent={onDeleteEvent}
            onAddEvent={onAddEvent}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

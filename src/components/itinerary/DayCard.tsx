'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Day } from '@/types';
import { cn } from '@/lib/utils';
import { EventCard } from './EventCard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  DollarSign,
  Zap,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface DayCardProps {
  day: Day;
  selectedEventIds: string[];
  onSelectEvent: (eventId: string, multiSelect: boolean) => void;
  onDeleteEvent: (dayNumber: number, eventId: string) => void;
  onAddEvent: (dayNumber: number) => void;
  isOver?: boolean;
}

const energyLevelColors: Record<Day['summary']['energy_level'], string> = {
  light: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  strenuous: 'bg-red-100 text-red-700',
};

const energyLevelLabels: Record<Day['summary']['energy_level'], string> = {
  light: 'Light',
  moderate: 'Moderate',
  strenuous: 'Strenuous',
};

export function DayCard({
  day,
  selectedEventIds,
  onSelectEvent,
  onDeleteEvent,
  onAddEvent,
  isOver = false,
}: DayCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `day-${day.day_number}`,
    data: {
      type: 'day',
      dayNumber: day.day_number,
    },
  });

  const eventIds = day.events.map((e) => e.id);
  const isHighlighted = isOver || isDroppableOver;

  // Format the date nicely
  const formattedDate = day.date
    ? format(parseISO(day.date), 'EEEE, MMMM d')
    : `Day ${day.day_number}`;

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200',
        isHighlighted && 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50',
        day.locked && 'border-green-300 bg-green-50/30'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {day.day_number}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
                {day.theme && (
                  <span className="text-sm text-gray-500">{day.theme}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Day Summary Badges */}
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${day.summary.total_cost}
            </Badge>
            <Badge
              variant="outline"
              className={cn('flex items-center gap-1', energyLevelColors[day.summary.energy_level])}
            >
              <Zap className="h-3 w-3" />
              {energyLevelLabels[day.summary.energy_level]}
            </Badge>
            <Badge variant="outline" className="text-gray-500">
              {day.events.length} events
            </Badge>

            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <SortableContext
            items={eventIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {day.events.length === 0 ? (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center text-gray-400 transition-colors',
                    isHighlighted && 'border-blue-400 bg-blue-50 text-blue-500'
                  )}
                >
                  {isHighlighted ? 'Drop event here' : 'No events scheduled'}
                </div>
              ) : (
                day.events
                  .sort((a, b) => a.order - b.order)
                  .map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      dayNumber={day.day_number}
                      isSelected={selectedEventIds.includes(event.id)}
                      onSelect={onSelectEvent}
                      onDelete={onDeleteEvent}
                    />
                  ))
              )}
            </div>
          </SortableContext>

          {/* Add Event Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-dashed text-gray-500 hover:text-gray-700"
            onClick={() => onAddEvent(day.day_number)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

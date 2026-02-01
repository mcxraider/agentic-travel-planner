'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Day, Event, DayWarning, EventConflictMap } from '@/types';
import { useItineraryContext } from '@/contexts';
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
  ChevronUp,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useEventAlternatives } from '@/hooks';

interface DayCardProps {
  // Required: the day data to display
  day: Day;
  // Optional props - can be provided via context instead
  selectedEventIds?: string[];
  visualSelections?: Record<string, string>;
  onSelectEvent?: (eventId: string, multiSelect: boolean) => void;
  onDeleteEvent?: (dayNumber: number, eventId: string) => void;
  onAddEvent?: (dayNumber: number) => void;
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  warnings?: DayWarning[];
  onDismissWarning?: (warningId: string) => void;
  eventConflicts?: EventConflictMap;
  onDismissConflict?: (eventId: string) => void;
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

/**
 * DayCard component that displays a single day's events.
 *
 * Supports two usage patterns:
 * 1. Context-based (recommended): Wrap with ItineraryProvider, only pass `day` prop
 * 2. Prop-based (legacy): Pass all required props directly
 *
 * @example Context-based usage:
 * <DayCard day={day} />
 *
 * @example Prop-based usage (backward compatible):
 * <DayCard
 *   day={day}
 *   selectedEventIds={selectedEventIds}
 *   onSelectEvent={handleSelectEvent}
 *   // ... other props
 * />
 */
export function DayCard({
  day,
  selectedEventIds: propSelectedEventIds,
  visualSelections: propVisualSelections = {},
  onSelectEvent: propOnSelectEvent,
  onDeleteEvent: propOnDeleteEvent,
  onAddEvent: propOnAddEvent,
  onAddAlternative: propOnAddAlternative,
  onVisualSelectionChange: propOnVisualSelectionChange,
  warnings: propWarnings = [],
  onDismissWarning: propOnDismissWarning,
  eventConflicts: propEventConflicts = {},
  onDismissConflict: propOnDismissConflict,
  isOver = false,
}: DayCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Try to get values from context, fall back to props
  const context = useItineraryContext();

  // Resolve values: context takes precedence, then props
  const selectedEventIds = context?.selectedEventIds ?? propSelectedEventIds ?? [];
  const visualSelections = context?.visualSelections ?? propVisualSelections;
  const eventConflicts = context?.eventConflicts ?? propEventConflicts;

  // Filter warnings for this day from context if available
  const contextWarnings = context?.warnings?.filter((w) => w.dayNumber === day.day_number);
  const warnings = contextWarnings ?? propWarnings;

  // Resolve callbacks: context takes precedence, then props
  const onSelectEvent = context?.selectEvent ?? propOnSelectEvent;
  const onDeleteEvent = context?.deleteEvent ?? propOnDeleteEvent;
  const onAddEvent = context?.openAddEvent ?? propOnAddEvent;
  const onAddAlternative = context?.openAddAlternative ?? propOnAddAlternative;
  const onVisualSelectionChange = context?.cycleAlternative ?? propOnVisualSelectionChange;
  const onDismissWarning = context?.dismissWarning ?? propOnDismissWarning;
  const onDismissConflict = context?.dismissConflict ?? propOnDismissConflict;

  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `day-${day.day_number}`,
    data: {
      type: 'day',
      dayNumber: day.day_number,
    },
  });

  // Use the hook to group events by alternativeGroupId
  const { primaryEvents, alternativesMap } = useEventAlternatives(day.events);

  const eventIds = primaryEvents.map((e) => e.id);
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
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">
                {day.day_number}
              </span>
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            {day.theme && (
              <span className="text-sm text-gray-500 ml-10">{day.theme}</span>
            )}
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
              {primaryEvents.length} events
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

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="px-6 pb-2 space-y-1">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <span className="flex-1 text-yellow-800">{warning.message}</span>
              {onDismissWarning && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                  onClick={() => onDismissWarning(warning.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

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
                primaryEvents.map((event) => {
                  const alternatives = alternativesMap.get(event.id) || [];
                  const groupId = event.alternativeGroupId;
                  const visuallySelectedId = groupId ? visualSelections[groupId] : undefined;

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      dayNumber={day.day_number}
                      isSelected={selectedEventIds.includes(event.id)}
                      onSelect={onSelectEvent}
                      onDelete={onDeleteEvent}
                      alternatives={alternatives}
                      onAddAlternative={alternatives.length < 2 ? onAddAlternative : undefined}
                      visuallySelectedId={visuallySelectedId}
                      onVisualSelectionChange={onVisualSelectionChange}
                      conflictMessage={eventConflicts[event.id]}
                      onDismissConflict={onDismissConflict}
                    />
                  );
                })
              )}
            </div>
          </SortableContext>

          {/* Add Event Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-dashed text-gray-500 hover:text-gray-700"
            onClick={() => onAddEvent?.(day.day_number)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

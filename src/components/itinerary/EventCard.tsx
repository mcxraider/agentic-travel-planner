'use client';

import { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import {
  GripVertical,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Utensils,
  Car,
  Bed,
  Briefcase,
  Activity,
  Plus,
  AlertTriangle,
  X,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EventCardProps {
  event: Event;
  dayNumber: number;
  isSelected: boolean;
  onSelect: (eventId: string, multiSelect: boolean) => void;
  onDelete: (dayNumber: number, eventId: string) => void;
  isDragging?: boolean;
  // Alternative support
  alternatives?: Event[];
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  // Visual selection for cycling (doesn't change store until Apply Changes)
  visuallySelectedId?: string;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  // Conflict support
  conflictMessage?: string;
  onDismissConflict?: (eventId: string) => void;
}

const eventTypeIcons: Record<Event['type'], React.ReactNode> = {
  logistics: <Briefcase className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  dining: <Utensils className="h-4 w-4" />,
  transit: <Car className="h-4 w-4" />,
  rest: <Bed className="h-4 w-4" />,
};

const eventTypeColors: Record<Event['type'], string> = {
  logistics: 'bg-slate-100 border-slate-300 text-slate-700',
  activity: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  dining: 'bg-amber-50 border-amber-300 text-amber-700',
  transit: 'bg-blue-50 border-blue-300 text-blue-700',
  rest: 'bg-purple-50 border-purple-300 text-purple-700',
};

// Lighter versions for stacked cards behind
const eventTypeColorsLight: Record<Event['type'], string> = {
  logistics: 'bg-slate-50 border-slate-200',
  activity: 'bg-emerald-50/50 border-emerald-200',
  dining: 'bg-amber-50/50 border-amber-200',
  transit: 'bg-blue-50/50 border-blue-200',
  rest: 'bg-purple-50/50 border-purple-200',
};

export function EventCard({
  event,
  dayNumber,
  isSelected,
  onSelect,
  onDelete,
  isDragging = false,
  alternatives = [],
  onAddAlternative,
  visuallySelectedId,
  onVisualSelectionChange,
  conflictMessage,
  onDismissConflict,
}: EventCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasConflict = !!conflictMessage;

  // Build the list of all options (primary + alternatives)
  const allOptions = useMemo(() => {
    return [event, ...alternatives];
  }, [event, alternatives]);

  const hasAlternatives = alternatives.length > 0;
  const totalOptions = allOptions.length;

  // Determine the currently displayed event based on visual selection
  const currentDisplayIndex = useMemo(() => {
    if (!visuallySelectedId) return 0;
    const idx = allOptions.findIndex((e) => e.id === visuallySelectedId);
    return idx >= 0 ? idx : 0;
  }, [visuallySelectedId, allOptions]);

  const displayedEvent = allOptions[currentDisplayIndex];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: event.id,
    data: {
      type: 'event',
      event,
      dayNumber,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle cycling through alternatives
  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasAlternatives || !onVisualSelectionChange || !event.alternativeGroupId) {
      return;
    }

    // Cycle to next option
    const nextIndex = (currentDisplayIndex + 1) % totalOptions;
    const nextEvent = allOptions[nextIndex];
    onVisualSelectionChange(event.alternativeGroupId, nextEvent.id);
  };

  // Handle card click for selection
  const handleCardClick = (e: React.MouseEvent) => {
    const multiSelect = e.metaKey || e.ctrlKey || e.shiftKey;
    onSelect(event.id, multiSelect);
  };

  const handleAddAlternative = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddAlternative) {
      onAddAlternative(dayNumber, event);
    }
  };

  const handleDismissConflict = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismissConflict) {
      onDismissConflict(event.id);
    }
  };

  // Render a single card (used for both the main card and stacked background cards)
  const renderCard = (cardEvent: Event, isMain: boolean, stackIndex: number = 0) => {
    const offset = stackIndex * 6; // 6px offset per card

    return (
      <div
        key={cardEvent.id}
        className={cn(
          'absolute inset-0 flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
          isMain
            ? hasConflict
              ? 'bg-red-50 border-red-400 text-red-900'
              : eventTypeColors[cardEvent.type]
            : eventTypeColorsLight[cardEvent.type],
          isMain && isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          isMain && (isDragging || isSortableDragging) && 'opacity-50 shadow-lg scale-105',
          isMain ? 'z-[3] hover:shadow-md' : stackIndex === 1 ? 'z-[2]' : 'z-[1]'
        )}
        style={{
          transform: isMain ? undefined : `translate(${offset}px, ${offset}px)`,
        }}
      >
        {isMain && (
          <>
            {/* Conflict Warning Icon */}
            {hasConflict && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute -top-2 -left-2 bg-red-500 rounded-full p-1">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{conflictMessage}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Stack Indicator (top-right) */}
            {hasAlternatives && (
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-medium rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
                <Layers className="h-3 w-3" />
                {currentDisplayIndex + 1}/{totalOptions}
              </div>
            )}

            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-black/5"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Time Column */}
            <div className="flex-shrink-0 w-16 text-xs font-medium">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cardEvent.time_start}
              </div>
              <div className="text-gray-500 mt-0.5">{cardEvent.time_end}</div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">{eventTypeIcons[cardEvent.type]}</span>
                <h4 className="font-medium text-sm truncate">{cardEvent.title}</h4>
              </div>

              {cardEvent.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {cardEvent.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {cardEvent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{cardEvent.location.name}</span>
                  </span>
                )}
                {cardEvent.cost && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {cardEvent.cost.amount} {cardEvent.cost.currency}
                  </span>
                )}
                <span className="text-gray-400">{cardEvent.duration_minutes} min</span>
              </div>
            </div>

            {/* Dismiss Conflict Button */}
            {hasConflict && onDismissConflict && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-7 w-7 rounded-full border border-red-300 bg-white hover:bg-red-50 hover:border-red-400"
                onClick={handleDismissConflict}
                title="Dismiss warning"
              >
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            )}

            {/* Action buttons row: Alt | + | Delete */}
            <div className="flex flex-row gap-1 flex-shrink-0">
              {/* Alt Button - Cycle through alternatives */}
              {hasAlternatives && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity rounded border border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400"
                  onClick={handleCycle}
                  title="Cycle through alternatives"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
                </Button>
              )}

              {/* Add Alternative Button */}
              {onAddAlternative && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-400"
                  onClick={handleAddAlternative}
                  title="Add alternative"
                >
                  <Plus className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              )}

              {/* Delete Button with Confirmation Popover */}
              <Popover open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" side="top" align="end">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(false);
                      onDelete(dayNumber, displayedEvent.id);
                    }}
                  >
                    Confirm
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>
    );
  };

  // Calculate the stack cards to show behind (max 2 behind = 3 total)
  const stackCards = useMemo(() => {
    if (!hasAlternatives) return [];

    // Get the events that should appear behind the current one
    const behind: { event: Event; stackIndex: number }[] = [];
    for (let i = 1; i < Math.min(totalOptions, 3); i++) {
      const idx = (currentDisplayIndex + i) % totalOptions;
      behind.push({ event: allOptions[idx], stackIndex: i });
    }
    return behind;
  }, [hasAlternatives, totalOptions, currentDisplayIndex, allOptions]);

  // Extra padding needed for stacked cards
  const stackPadding = hasAlternatives ? Math.min(alternatives.length, 2) * 6 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      {/* Container with padding for stack effect */}
      <div
        className="group relative cursor-pointer"
        style={{
          paddingRight: stackPadding,
          paddingBottom: stackPadding,
        }}
        onClick={handleCardClick}
      >
        {/* Background stacked cards (rendered first, so they appear behind) */}
        <div className="relative" style={{ minHeight: '80px' }}>
          {stackCards.map(({ event: stackEvent, stackIndex }) =>
            renderCard(stackEvent, false, stackIndex)
          )}

          {/* Main (front) card */}
          {renderCard(displayedEvent, true, 0)}
        </div>
      </div>

    </div>
  );
}

// Drag overlay version (shown when dragging)
export function EventCardDragOverlay({ event }: { event: Event }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border-2 shadow-xl',
        eventTypeColors[event.type],
        'ring-2 ring-blue-500'
      )}
    >
      <div className="flex-shrink-0 p-1">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex-shrink-0 w-16 text-xs font-medium">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {event.time_start}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0">{eventTypeIcons[event.type]}</span>
          <h4 className="font-medium text-sm truncate">{event.title}</h4>
        </div>
      </div>
    </div>
  );
}

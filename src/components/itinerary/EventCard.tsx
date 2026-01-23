'use client';

import { useState } from 'react';
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
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  onPromoteAlternative?: (dayNumber: number, alternativeId: string) => void;
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

export function EventCard({
  event,
  dayNumber,
  isSelected,
  onSelect,
  onDelete,
  isDragging = false,
  alternatives = [],
  onAddAlternative,
  onPromoteAlternative,
  conflictMessage,
  onDismissConflict,
}: EventCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const hasConflict = !!conflictMessage;

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const multiSelect = e.metaKey || e.ctrlKey || e.shiftKey;
    onSelect(event.id, multiSelect);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(dayNumber, event.id);
  };

  const handleAddAlternative = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddAlternative) {
      onAddAlternative(dayNumber, event);
    }
  };

  const handlePromoteAlternative = (e: React.MouseEvent, alternativeId: string) => {
    e.stopPropagation();
    if (onPromoteAlternative) {
      onPromoteAlternative(dayNumber, alternativeId);
    }
  };

  const handleToggleAlternatives = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAlternatives(!showAlternatives);
  };

  const hasAlternatives = alternatives.length > 0;

  const handleDismissConflict = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismissConflict) {
      onDismissConflict(event.id);
    }
  };

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
          hasConflict
            ? 'bg-red-50 border-red-400 text-red-900'
            : eventTypeColors[event.type],
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          (isDragging || isSortableDragging) && 'opacity-50 shadow-lg scale-105',
          'hover:shadow-md cursor-pointer'
        )}
        onClick={handleClick}
      >
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

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-black/5"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        {/* Time Column */}
        <div className="flex-shrink-0 w-16 text-xs font-medium">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time_start}
          </div>
          <div className="text-gray-500 mt-0.5">
            {event.time_end}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0">{eventTypeIcons[event.type]}</span>
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
            {/* Alternatives Badge */}
            {hasAlternatives && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-100"
                onClick={handleToggleAlternatives}
              >
                <ArrowLeftRight className="h-3 w-3" />
                {alternatives.length} alt{alternatives.length > 1 ? 's' : ''}
                {showAlternatives ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Badge>
            )}
          </div>

          {event.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{event.location.name}</span>
              </span>
            )}
            {event.cost && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {event.cost.amount} {event.cost.currency}
              </span>
            )}
            <span className="text-gray-400">
              {event.duration_minutes} min
            </span>
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

        {/* Add Alternative Button */}
        {onAddAlternative && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-400"
            onClick={handleAddAlternative}
            title="Add alternative"
          >
            <Plus className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        )}

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Alternatives List (expanded) */}
      {showAlternatives && hasAlternatives && (
        <div className="ml-8 space-y-1 border-l-2 border-blue-200 pl-3">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md border transition-all cursor-pointer',
                'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              )}
              onClick={(e) => handlePromoteAlternative(e, alt.id)}
            >
              <ArrowLeftRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 text-gray-500">
                    {eventTypeIcons[alt.type]}
                  </span>
                  <span className="text-sm font-medium truncate">{alt.title}</span>
                </div>
                {alt.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{alt.description}</p>
                )}
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                Swap
              </Badge>
            </div>
          ))}
        </div>
      )}
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

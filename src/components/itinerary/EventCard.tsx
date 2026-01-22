'use client';

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
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  event: Event;
  dayNumber: number;
  isSelected: boolean;
  onSelect: (eventId: string, multiSelect: boolean) => void;
  onDelete: (dayNumber: number, eventId: string) => void;
  isDragging?: boolean;
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
}: EventCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
        eventTypeColors[event.type],
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg scale-105',
        'hover:shadow-md cursor-pointer'
      )}
      onClick={handleClick}
    >
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

'use client';

import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { useEventCard } from './EventCardContext';

interface EventCardDragHandleProps {
  className?: string;
}

/**
 * Drag handle for EventCard.
 * Renders the grip icon with drag-drop listeners.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.DragHandle />
 *   ...
 * </EventCard.Root>
 */
export function EventCardDragHandle({ className }: EventCardDragHandleProps) {
  const { sortableAttributes, sortableListeners } = useEventCard();

  return (
    <div
      {...sortableAttributes}
      {...sortableListeners}
      className={cn(
        'flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-black/5',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="h-5 w-5 text-gray-400" />
    </div>
  );
}

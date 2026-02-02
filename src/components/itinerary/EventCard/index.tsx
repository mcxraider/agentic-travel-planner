'use client';

import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { getEventTypeConfig } from '@/config';
import { GripVertical, Clock } from 'lucide-react';

// Import all compound component parts
import {
  EventCardProvider,
  useEventCard,
  useEventCardContext,
} from './EventCardContext';
import { EventCardRoot } from './EventCardRoot';
import { EventCardDragHandle } from './EventCardDragHandle';
import {
  EventCardContent,
  EventCardTime,
  EventCardDetails,
  EventCardConflictBadge,
  EventCardStackIndicator,
} from './EventCardContent';
import {
  EventCardActions,
  EventCardDismissConflict,
  EventCardCycleButton,
  EventCardAddAlternativeButton,
  EventCardDeleteButton,
} from './EventCardActions';
import { EventCardMetadataDropdown } from './EventCardMetadataDropdown';

// Re-export types and hooks for external use
export type { EventCardContextValue, EventCardProviderProps } from './EventCardContext';
export { useEventCard, useEventCardContext };

/**
 * EventCard Compound Component
 *
 * Provides a flexible, composable API for rendering event cards.
 * Each sub-component can be used independently for custom layouts.
 *
 * @example Compound usage (full control):
 * <EventCard.Provider event={event} dayNumber={1} alternatives={alts}>
 *   <EventCard.Root>
 *     <EventCard.ConflictBadge />
 *     <EventCard.StackIndicator />
 *     <EventCard.DragHandle />
 *     <EventCard.Time />
 *     <EventCard.Details />
 *     <EventCard.Actions />
 *   </EventCard.Root>
 * </EventCard.Provider>
 *
 * @example Compound usage (convenience components):
 * <EventCard.Provider event={event} dayNumber={1}>
 *   <EventCard.Root>
 *     <EventCard.ConflictBadge />
 *     <EventCard.StackIndicator />
 *     <EventCard.DragHandle />
 *     <EventCard.Content />
 *     <EventCard.Actions />
 *   </EventCard.Root>
 * </EventCard.Provider>
 *
 * @example Legacy usage (backward compatible):
 * <EventCard
 *   event={event}
 *   dayNumber={1}
 *   isSelected={false}
 *   onSelect={handleSelect}
 *   onDelete={handleDelete}
 *   alternatives={alternatives}
 * />
 */
export const EventCard = Object.assign(EventCardLegacy, {
  // Provider
  Provider: EventCardProvider,

  // Root container
  Root: EventCardRoot,

  // Content parts
  DragHandle: EventCardDragHandle,
  Time: EventCardTime,
  Details: EventCardDetails,
  Content: EventCardContent,
  ConflictBadge: EventCardConflictBadge,
  StackIndicator: EventCardStackIndicator,

  // Action parts
  Actions: EventCardActions,
  DismissConflict: EventCardDismissConflict,
  CycleButton: EventCardCycleButton,
  AddAlternativeButton: EventCardAddAlternativeButton,
  DeleteButton: EventCardDeleteButton,

  // Metadata
  MetadataDropdown: EventCardMetadataDropdown,
});

/**
 * Legacy EventCard API for backward compatibility.
 * This wraps the compound components to provide the original prop-based interface.
 */
interface EventCardLegacyProps {
  event: Event;
  dayNumber: number;
  isSelected?: boolean;
  onSelect?: (eventId: string, multiSelect: boolean) => void;
  onDelete?: (dayNumber: number, eventId: string) => void;
  isDragging?: boolean;
  alternatives?: Event[];
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  visuallySelectedId?: string;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  conflictMessage?: string;
  onDismissConflict?: (eventId: string) => void;
}

/**
 * Legacy EventCard component that wraps the compound components.
 * Maintains full backward compatibility with the original API.
 */
function EventCardLegacy({
  event,
  dayNumber,
  isSelected,
  onSelect,
  onDelete,
  isDragging,
  alternatives = [],
  onAddAlternative,
  visuallySelectedId,
  onVisualSelectionChange,
  conflictMessage,
  onDismissConflict,
}: EventCardLegacyProps) {
  return (
    <EventCardProvider
      event={event}
      dayNumber={dayNumber}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      isDragging={isDragging}
      alternatives={alternatives}
      onAddAlternative={onAddAlternative}
      visuallySelectedId={visuallySelectedId}
      onVisualSelectionChange={onVisualSelectionChange}
      conflictMessage={conflictMessage}
      onDismissConflict={onDismissConflict}
    >
      <EventCardRoot>
        {/* Badges */}
        <EventCardConflictBadge />
        <EventCardStackIndicator />

        {/* Main content */}
        <EventCardDragHandle />
        <EventCardContent showMetadataDropdown />
        <EventCardActions
          maxAlternatives={2}
        />
      </EventCardRoot>
    </EventCardProvider>
  );
}

/**
 * Drag overlay version of EventCard.
 * Simplified rendering for the drag preview.
 */
export function EventCardDragOverlay({ event }: { event: Event }) {
  const typeConfig = getEventTypeConfig(event.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border-2 shadow-xl',
        typeConfig.colorClass,
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
          <span className="flex-shrink-0">
            <TypeIcon className="h-4 w-4" />
          </span>
          <h4 className="font-medium text-sm truncate">{event.title}</h4>
        </div>
      </div>
    </div>
  );
}

// Default export for simple imports
export default EventCard;

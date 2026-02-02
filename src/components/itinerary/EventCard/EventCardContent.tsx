'use client';

import { cn } from '@/lib/utils';
import { getEventTypeConfig } from '@/config';
import {
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEventCard } from './EventCardContext';
import { EventCardMetadataDropdown } from './EventCardMetadataDropdown';

interface EventCardTimeProps {
  className?: string;
}

/**
 * Time column showing start and end times.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.DragHandle />
 *   <EventCard.Time />
 *   <EventCard.Details />
 * </EventCard.Root>
 */
export function EventCardTime({ className }: EventCardTimeProps) {
  const { displayedEvent } = useEventCard();

  return (
    <div className={cn('flex-shrink-0 w-16 text-xs font-medium', className)}>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {displayedEvent.time_start}
      </div>
      <div className="text-gray-500 mt-0.5">{displayedEvent.time_end}</div>
    </div>
  );
}

interface EventCardDetailsProps {
  className?: string;
  /** Whether to show the description. Defaults to true. */
  showDescription?: boolean;
  /** Whether to show metadata (location, cost, duration). Defaults to true. */
  showMetadata?: boolean;
  /** Whether to show the expandable metadata dropdown. Defaults to false. */
  showMetadataDropdown?: boolean;
}

/**
 * Main content area showing icon, title, description, and metadata.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.Details />
 * </EventCard.Root>
 */
export function EventCardDetails({
  className,
  showDescription = true,
  showMetadata = true,
  showMetadataDropdown = false,
}: EventCardDetailsProps) {
  const { displayedEvent } = useEventCard();
  const typeConfig = getEventTypeConfig(displayedEvent.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className={cn('flex-1 min-w-0', className)}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0">
          <TypeIcon className="h-4 w-4" />
        </span>
        <h4 className="font-medium text-sm truncate">{displayedEvent.title}</h4>
      </div>

      {/* Description */}
      {showDescription && displayedEvent.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {displayedEvent.description}
        </p>
      )}

      {/* Metadata row */}
      {showMetadata && (
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {displayedEvent.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">
                {displayedEvent.location.name}
              </span>
            </span>
          )}
          {displayedEvent.cost && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {displayedEvent.cost.amount} {displayedEvent.cost.currency}
            </span>
          )}
          <span className="text-gray-400">{displayedEvent.duration_minutes} min</span>
        </div>
      )}

      {/* Expandable metadata dropdown */}
      {showMetadataDropdown && <EventCardMetadataDropdown />}
    </div>
  );
}

interface EventCardConflictBadgeProps {
  className?: string;
}

/**
 * Conflict warning badge shown in top-left corner when event has conflicts.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.ConflictBadge />
 *   ...
 * </EventCard.Root>
 */
export function EventCardConflictBadge({ className }: EventCardConflictBadgeProps) {
  const { hasConflict, conflictMessage } = useEventCard();

  if (!hasConflict) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute -top-2 -left-2 bg-red-500 rounded-full p-1',
              className
            )}
          >
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{conflictMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EventCardStackIndicatorProps {
  className?: string;
}

/**
 * Stack indicator badge shown in top-right corner when event has alternatives.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.StackIndicator />
 *   ...
 * </EventCard.Root>
 */
export function EventCardStackIndicator({ className }: EventCardStackIndicatorProps) {
  const { hasAlternatives, currentDisplayIndex, totalOptions } = useEventCard();

  if (!hasAlternatives) return null;

  return (
    <div
      className={cn(
        'absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-medium rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm',
        className
      )}
    >
      <Layers className="h-3 w-3" />
      {currentDisplayIndex + 1}/{totalOptions}
    </div>
  );
}

interface EventCardContentProps {
  className?: string;
  /** Whether to show the description. Defaults to true. */
  showDescription?: boolean;
  /** Whether to show metadata (location, cost, duration). Defaults to true. */
  showMetadata?: boolean;
  /** Whether to show the expandable metadata dropdown. Defaults to false. */
  showMetadataDropdown?: boolean;
}

/**
 * Composite content component that renders Time + Details together.
 * This is a convenience wrapper for the common layout.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.DragHandle />
 *   <EventCard.Content />
 *   <EventCard.Actions />
 * </EventCard.Root>
 */
export function EventCardContent({
  className,
  showDescription = true,
  showMetadata = true,
  showMetadataDropdown = false,
}: EventCardContentProps) {
  return (
    <>
      <EventCardTime />
      <EventCardDetails
        className={className}
        showDescription={showDescription}
        showMetadata={showMetadata}
        showMetadataDropdown={showMetadataDropdown}
      />
    </>
  );
}

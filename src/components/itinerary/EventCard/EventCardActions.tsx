'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, Plus, X, ArrowLeftRight, MoreHorizontal, Pencil } from 'lucide-react';
import { useEventCard } from './EventCardContext';

interface EventCardDismissConflictProps {
  className?: string;
}

/**
 * Button to dismiss a conflict warning.
 * Only renders when the event has a conflict and dismiss handler is available.
 *
 * @example
 * <EventCard.Root>
 *   ...
 *   <EventCard.DismissConflict />
 * </EventCard.Root>
 */
export function EventCardDismissConflict({ className }: EventCardDismissConflictProps) {
  const { event, hasConflict, onDismissConflict } = useEventCard();

  if (!hasConflict || !onDismissConflict) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismissConflict(event.id);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'flex-shrink-0 h-7 w-7 rounded-full border border-red-300 bg-white hover:bg-red-50 hover:border-red-400',
        className
      )}
      onClick={handleClick}
      title="Dismiss warning"
    >
      <X className="h-3.5 w-3.5 text-red-500" />
    </Button>
  );
}

interface EventCardCycleButtonProps {
  className?: string;
}

/**
 * Button to cycle through alternative events.
 * Only renders when there are alternatives available.
 *
 * @example
 * <EventCard.Root>
 *   ...
 *   <EventCard.CycleButton />
 * </EventCard.Root>
 */
export function EventCardCycleButton({ className }: EventCardCycleButtonProps) {
  const { hasAlternatives, onCycleAlternative } = useEventCard();

  if (!hasAlternatives || !onCycleAlternative) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCycleAlternative();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity rounded border border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400',
        className
      )}
      onClick={handleClick}
      title="Cycle through alternatives"
    >
      <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
    </Button>
  );
}

interface EventCardAddAlternativeButtonProps {
  className?: string;
  /** Maximum number of alternatives allowed (excluding primary). Defaults to 2. */
  maxAlternatives?: number;
}

/**
 * Button to add an alternative to this event.
 * Only renders when the add alternative handler is available and limit not reached.
 *
 * @example
 * <EventCard.Root>
 *   ...
 *   <EventCard.AddAlternativeButton />
 * </EventCard.Root>
 */
export function EventCardAddAlternativeButton({
  className,
  maxAlternatives = 2,
}: EventCardAddAlternativeButtonProps) {
  const { event, dayNumber, alternatives, onAddAlternative } = useEventCard();

  // Don't show if no handler or max alternatives reached
  if (!onAddAlternative || alternatives.length >= maxAlternatives) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddAlternative(dayNumber, event);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-400',
        className
      )}
      onClick={handleClick}
      title="Add alternative"
    >
      <Plus className="h-3.5 w-3.5 text-gray-500" />
    </Button>
  );
}

interface EventCardMoreActionsButtonProps {
  className?: string;
  /** Maximum number of alternatives allowed (excluding primary). Defaults to 2. */
  maxAlternatives?: number;
}

/**
 * "..." button that opens a popover menu with actions: Add Alternative, Edit Event.
 * Replaces the standalone AddAlternativeButton.
 */
export function EventCardMoreActionsButton({
  className,
  maxAlternatives = 2,
}: EventCardMoreActionsButtonProps) {
  const [open, setOpen] = useState(false);
  const { event, dayNumber, alternatives, onAddAlternative, onEditEvent } = useEventCard();

  const canAddAlternative = onAddAlternative && alternatives.length < maxAlternatives;
  const canEdit = !!onEditEvent;

  if (!canAddAlternative && !canEdit) return null;

  const handleAddAlternative = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onAddAlternative!(dayNumber, event);
  };

  const handleEditEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onEditEvent!(dayNumber, event);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-400',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          title="More actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" side="top" align="end">
        <div className="flex flex-col">
          {canAddAlternative && (
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
              onClick={handleAddAlternative}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Alternative
            </button>
          )}
          {canEdit && (
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
              onClick={handleEditEvent}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Event
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface EventCardDeleteButtonProps {
  className?: string;
  /** Whether to show confirmation popover. Defaults to true. */
  requireConfirmation?: boolean;
}

/**
 * Delete button with optional confirmation popover.
 *
 * @example
 * <EventCard.Root>
 *   ...
 *   <EventCard.DeleteButton />
 * </EventCard.Root>
 */
export function EventCardDeleteButton({
  className,
  requireConfirmation = true,
}: EventCardDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { displayedEvent, dayNumber, onDelete } = useEventCard();

  if (!onDelete) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
    onDelete(dayNumber, displayedEvent.id);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (requireConfirmation) {
      setShowConfirm(true);
    } else {
      onDelete(dayNumber, displayedEvent.id);
    }
  };

  if (!requireConfirmation) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full',
          className
        )}
        onClick={handleTriggerClick}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Popover open={showConfirm} onOpenChange={setShowConfirm}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full',
            className
          )}
          onClick={handleTriggerClick}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="end">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
        >
          Confirm
        </Button>
      </PopoverContent>
    </Popover>
  );
}

interface EventCardActionsProps {
  className?: string;
  /** Whether to show dismiss conflict button. Defaults to true. */
  showDismissConflict?: boolean;
  /** Whether to show cycle button. Defaults to true. */
  showCycleButton?: boolean;
  /** Whether to show add alternative button. Defaults to true. */
  showAddAlternative?: boolean;
  /** Whether to show delete button. Defaults to true. */
  showDelete?: boolean;
  /** Maximum number of alternatives allowed. Defaults to 2. */
  maxAlternatives?: number;
}

/**
 * Composite actions component that renders all action buttons.
 * This is a convenience wrapper for the common layout.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.DragHandle />
 *   <EventCard.Content />
 *   <EventCard.Actions />
 * </EventCard.Root>
 */
export function EventCardActions({
  className,
  showDismissConflict = true,
  showCycleButton = true,
  showAddAlternative = true,
  showDelete = true,
  maxAlternatives = 2,
}: EventCardActionsProps) {
  return (
    <>
      {/* Dismiss Conflict Button (separate from action row) */}
      {showDismissConflict && <EventCardDismissConflict />}

      {/* Action buttons row */}
      <div className={cn('flex flex-row gap-1 flex-shrink-0', className)}>
        {showCycleButton && <EventCardCycleButton />}
        {showAddAlternative && <EventCardMoreActionsButton maxAlternatives={maxAlternatives} />}
        {showDelete && <EventCardDeleteButton />}
      </div>
    </>
  );
}

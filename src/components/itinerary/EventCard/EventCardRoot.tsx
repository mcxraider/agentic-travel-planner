'use client';

import { useMemo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getEventTypeConfig } from '@/config';
import { useEventCard } from './EventCardContext';

interface EventCardRootProps {
  children: ReactNode;
  className?: string;
  /** Whether to render stacked background cards for alternatives. Defaults to true when alternatives exist. */
  showStack?: boolean;
}

/**
 * Root container for EventCard compound component.
 * Handles drag-drop wrapper, click selection, and stacked card effect.
 *
 * @example
 * <EventCard.Root>
 *   <EventCard.DragHandle />
 *   <EventCard.Content />
 *   <EventCard.Actions />
 * </EventCard.Root>
 */
export function EventCardRoot({ children, className, showStack }: EventCardRootProps) {
  const {
    event,
    displayedEvent,
    isSelected,
    isDragging,
    hasConflict,
    hasAlternatives,
    allOptions,
    currentDisplayIndex,
    totalOptions,
    setNodeRef,
    sortableStyle,
    onSelect,
  } = useEventCard();

  // Handle card click for selection
  const handleCardClick = (e: React.MouseEvent) => {
    const multiSelect = e.metaKey || e.ctrlKey || e.shiftKey;
    onSelect?.(event.id, multiSelect);
  };

  // Determine whether to show stacked cards
  const shouldShowStack = showStack ?? hasAlternatives;

  // Calculate the stack cards to show behind (max 2 behind = 3 total)
  const stackCards = useMemo(() => {
    if (!shouldShowStack || !hasAlternatives) return [];

    const behind: { event: typeof event; stackIndex: number }[] = [];
    for (let i = 1; i < Math.min(totalOptions, 3); i++) {
      const idx = (currentDisplayIndex + i) % totalOptions;
      behind.push({ event: allOptions[idx], stackIndex: i });
    }
    return behind;
  }, [shouldShowStack, hasAlternatives, totalOptions, currentDisplayIndex, allOptions]);

  // Extra padding needed for stacked cards
  const stackPadding = shouldShowStack && hasAlternatives ? Math.min(allOptions.length - 1, 2) * 6 : 0;

  // Get the type config for the displayed event
  const typeConfig = getEventTypeConfig(displayedEvent.type);

  return (
    <div ref={setNodeRef} style={sortableStyle} className="relative">
      {/* Container with padding for stack effect */}
      <div
        className={cn('group relative cursor-pointer', className)}
        style={{
          paddingRight: stackPadding,
          paddingBottom: stackPadding,
        }}
        onClick={handleCardClick}
      >
        {/* Background stacked cards (rendered first, so they appear behind) */}
        <div className="relative" style={{ minHeight: '80px' }}>
          {stackCards.map(({ event: stackEvent, stackIndex }) => (
            <StackedCard key={stackEvent.id} event={stackEvent} stackIndex={stackIndex} />
          ))}

          {/* Main (front) card */}
          <div
            className={cn(
              'absolute inset-0 flex items-start gap-3 p-3 rounded-lg border-2 transition-all z-[3] hover:shadow-md',
              hasConflict
                ? 'bg-red-50 border-red-400 text-red-900'
                : typeConfig.colorClass,
              isSelected && 'ring-2 ring-blue-500 ring-offset-2',
              isDragging && 'opacity-50 shadow-lg scale-105'
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a single stacked background card.
 * Used internally by EventCardRoot.
 */
function StackedCard({ event, stackIndex }: { event: { type: string }; stackIndex: number }) {
  const offset = stackIndex * 6;
  const typeConfig = getEventTypeConfig(event.type);

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
        typeConfig.colorClassLight,
        stackIndex === 1 ? 'z-[2]' : 'z-[1]'
      )}
      style={{
        transform: `translate(${offset}px, ${offset}px)`,
      }}
    />
  );
}

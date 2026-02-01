'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Event } from '@/types';
import { useItineraryContext } from '@/contexts';

/**
 * Context value for EventCard compound components.
 * Provides shared state and handlers to all sub-components.
 */
export interface EventCardContextValue {
  // Core data
  event: Event;
  dayNumber: number;

  // Display state
  isSelected: boolean;
  isDragging: boolean;
  hasConflict: boolean;
  conflictMessage: string | undefined;

  // Alternatives
  alternatives: Event[];
  allOptions: Event[];
  displayedEvent: Event;
  currentDisplayIndex: number;
  hasAlternatives: boolean;
  totalOptions: number;
  visuallySelectedId: string | undefined;

  // Drag-drop attributes (from useSortable)
  sortableAttributes: DraggableAttributes;
  sortableListeners: SyntheticListenerMap | undefined;
  setNodeRef: (node: HTMLElement | null) => void;
  sortableStyle: React.CSSProperties;

  // Actions
  onSelect?: (eventId: string, multiSelect: boolean) => void;
  onDelete?: (dayNumber: number, eventId: string) => void;
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  onCycleAlternative?: () => void;
  onDismissConflict?: (eventId: string) => void;
}

const EventCardContext = createContext<EventCardContextValue | null>(null);

export interface EventCardProviderProps {
  children: ReactNode;
  // Required props
  event: Event;
  dayNumber: number;
  // Optional props - can be provided via ItineraryContext
  isSelected?: boolean;
  onSelect?: (eventId: string, multiSelect: boolean) => void;
  onDelete?: (dayNumber: number, eventId: string) => void;
  isDragging?: boolean;
  // Alternative support
  alternatives?: Event[];
  onAddAlternative?: (dayNumber: number, event: Event) => void;
  // Visual selection for cycling
  visuallySelectedId?: string;
  onVisualSelectionChange?: (groupId: string, eventId: string) => void;
  // Conflict support
  conflictMessage?: string;
  onDismissConflict?: (eventId: string) => void;
}

/**
 * Provider component that sets up the EventCard context.
 * Handles integration with ItineraryContext, useSortable, and manages alternatives.
 */
export function EventCardProvider({
  children,
  event,
  dayNumber,
  isSelected: propIsSelected,
  onSelect: propOnSelect,
  onDelete: propOnDelete,
  isDragging: propIsDragging = false,
  alternatives = [],
  onAddAlternative: propOnAddAlternative,
  visuallySelectedId: propVisuallySelectedId,
  onVisualSelectionChange: propOnVisualSelectionChange,
  conflictMessage: propConflictMessage,
  onDismissConflict: propOnDismissConflict,
}: EventCardProviderProps) {
  // Try to get values from ItineraryContext, fall back to props
  const itineraryContext = useItineraryContext();

  // Resolve isSelected: context takes precedence, then prop
  const isSelected =
    propIsSelected ?? itineraryContext?.selectedEventIds?.includes(event.id) ?? false;

  // Resolve conflict message: prop takes precedence, then context
  const conflictMessage = propConflictMessage ?? itineraryContext?.eventConflicts?.[event.id];
  const hasConflict = !!conflictMessage;

  // Resolve visual selection: prop takes precedence, then context
  const groupId = event.alternativeGroupId;
  const visuallySelectedId =
    propVisuallySelectedId ?? (groupId ? itineraryContext?.visualSelections?.[groupId] : undefined);

  // Resolve callbacks: context takes precedence, then props
  const onSelect = itineraryContext?.selectEvent ?? propOnSelect;
  const onDelete = itineraryContext?.deleteEvent ?? propOnDelete;
  const onAddAlternative = itineraryContext?.openAddAlternative ?? propOnAddAlternative;
  const onVisualSelectionChange = itineraryContext?.cycleAlternative ?? propOnVisualSelectionChange;
  const onDismissConflict = itineraryContext?.dismissConflict ?? propOnDismissConflict;

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

  // Setup sortable for drag-drop
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

  const sortableStyle: React.CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  );

  const isDragging = propIsDragging || isSortableDragging;

  // Handle cycling through alternatives
  const handleCycleAlternative = useMemo(() => {
    if (!hasAlternatives || !onVisualSelectionChange || !groupId) {
      return undefined;
    }

    return () => {
      const nextIndex = (currentDisplayIndex + 1) % totalOptions;
      const nextEvent = allOptions[nextIndex];
      onVisualSelectionChange(groupId, nextEvent.id);
    };
  }, [
    hasAlternatives,
    onVisualSelectionChange,
    groupId,
    currentDisplayIndex,
    totalOptions,
    allOptions,
  ]);

  const contextValue: EventCardContextValue = useMemo(
    () => ({
      // Core data
      event,
      dayNumber,

      // Display state
      isSelected,
      isDragging,
      hasConflict,
      conflictMessage,

      // Alternatives
      alternatives,
      allOptions,
      displayedEvent,
      currentDisplayIndex,
      hasAlternatives,
      totalOptions,
      visuallySelectedId,

      // Drag-drop
      sortableAttributes: attributes,
      sortableListeners: listeners,
      setNodeRef,
      sortableStyle,

      // Actions
      onSelect,
      onDelete,
      onAddAlternative,
      onCycleAlternative: handleCycleAlternative,
      onDismissConflict,
    }),
    [
      event,
      dayNumber,
      isSelected,
      isDragging,
      hasConflict,
      conflictMessage,
      alternatives,
      allOptions,
      displayedEvent,
      currentDisplayIndex,
      hasAlternatives,
      totalOptions,
      visuallySelectedId,
      attributes,
      listeners,
      setNodeRef,
      sortableStyle,
      onSelect,
      onDelete,
      onAddAlternative,
      handleCycleAlternative,
      onDismissConflict,
    ]
  );

  return (
    <EventCardContext.Provider value={contextValue}>{children}</EventCardContext.Provider>
  );
}

/**
 * Hook to access EventCard context.
 * Returns null if not within an EventCardProvider.
 */
export function useEventCardContext(): EventCardContextValue | null {
  return useContext(EventCardContext);
}

/**
 * Hook to access EventCard context with error if not available.
 * Use this in sub-components that require the context.
 */
export function useEventCard(): EventCardContextValue {
  const context = useContext(EventCardContext);
  if (!context) {
    throw new Error('useEventCard must be used within EventCard.Root or EventCardProvider');
  }
  return context;
}

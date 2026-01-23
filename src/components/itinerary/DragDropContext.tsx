'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Event } from '@/types';
import { EventCardDragOverlay } from './EventCard';

interface DragDropContextProps {
  children: React.ReactNode;
  onMoveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  onDragStart?: () => void;
}

interface ActiveDragData {
  event: Event;
  dayNumber: number;
}

export function DragDropContext({
  children,
  onMoveEvent,
  onDragStart,
}: DragDropContextProps) {
  const [activeData, setActiveData] = useState<ActiveDragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current;

      if (data?.type === 'event') {
        setActiveData({
          event: data.event as Event,
          dayNumber: data.dayNumber as number,
        });
        onDragStart?.();
      }
    },
    [onDragStart]
  );

  const handleDragOver = useCallback(() => {
    // Tracking drag over for visual feedback is handled by dnd-kit
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveData(null);

      if (!over || !activeData) return;

      const activeId = active.id as string;
      const activeDay = activeData.dayNumber;

      const overData = over.data.current;
      let targetDay: number;
      let targetIndex: number | undefined;

      if (overData?.type === 'day') {
        // Dropped on a day container
        targetDay = overData.dayNumber as number;
        targetIndex = undefined; // Will be added at the end
      } else if (overData?.type === 'event') {
        // Dropped on another event
        targetDay = overData.dayNumber as number;
        // Get the index of the event we're dropping onto
        targetIndex = overData.event?.order;
      } else {
        return;
      }

      // Only move if something changed
      if (activeDay !== targetDay || targetIndex !== undefined) {
        onMoveEvent(activeId, activeDay, targetDay, targetIndex);
      }
    },
    [activeData, onMoveEvent]
  );

  const handleDragCancel = useCallback(() => {
    setActiveData(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      <DragOverlay dropAnimation={null}>
        {activeData && (
          <div className="w-[400px]">
            <EventCardDragOverlay event={activeData.event} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

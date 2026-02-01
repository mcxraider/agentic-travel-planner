'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GripVertical, X, Plus } from 'lucide-react';

interface RankedSelectorProps {
  options: string[];
  value?: Record<string, string>; // {"1": "...", "2": "...", "3": "..."}
  onChange: (value: Record<string, string>) => void;
  allowCustom?: boolean;
  maxSelections?: number;
}

interface SortableItemProps {
  id: string;
  rank: number;
  label: string;
  onRemove: () => void;
}

function SortableItem({ id, rank, label, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-background p-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {rank}
      </span>
      <span className="flex-1 text-sm">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RankedSelector({
  options,
  value,
  onChange,
  allowCustom = false,
  maxSelections = 3,
}: RankedSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  // Convert object format to array for internal state
  const rankedItems = useMemo(() => {
    if (!value) return [];
    const items: string[] = [];
    // Sort by position key and extract values
    const positions = Object.keys(value)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
    for (const pos of positions) {
      const item = value[String(pos)];
      if (item) items.push(item);
    }
    return items;
  }, [value]);

  // Available options (not yet ranked)
  const availableOptions = useMemo(() => {
    return options.filter((opt) => !rankedItems.includes(opt));
  }, [options, rankedItems]);

  // Convert array back to object format for API
  const arrayToObject = (items: string[]): Record<string, string> => {
    const result: Record<string, string> = {};
    items.forEach((item, index) => {
      result[String(index + 1)] = item;
    });
    return result;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rankedItems.indexOf(active.id as string);
      const newIndex = rankedItems.indexOf(over.id as string);
      const newItems = arrayMove(rankedItems, oldIndex, newIndex);
      onChange(arrayToObject(newItems));
    }
  };

  const handleAddOption = (option: string) => {
    if (rankedItems.length >= maxSelections) return;
    const newItems = [...rankedItems, option];
    onChange(arrayToObject(newItems));
  };

  const handleRemoveItem = (item: string) => {
    const newItems = rankedItems.filter((i) => i !== item);
    onChange(arrayToObject(newItems));
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || rankedItems.length >= maxSelections) return;
    if (rankedItems.includes(trimmed)) return;
    const newItems = [...rankedItems, trimmed];
    onChange(arrayToObject(newItems));
    setCustomInput('');
  };

  const canAddMore = rankedItems.length < maxSelections;

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Drag to reorder. Add up to {maxSelections} items.
      </p>

      {/* Ranked items */}
      {rankedItems.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rankedItems}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {rankedItems.map((item, index) => (
                <SortableItem
                  key={item}
                  id={item}
                  rank={index + 1}
                  label={item}
                  onRemove={() => handleRemoveItem(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Select options below to rank them
        </div>
      )}

      {/* Available options */}
      {canAddMore && availableOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Click to add:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddOption(option)}
                className="h-auto py-1.5"
              >
                <Plus className="mr-1 h-3 w-3" />
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom input */}
      {allowCustom && canAddMore && (
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add your own..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
          >
            Add
          </Button>
        </div>
      )}

      {/* Selection count */}
      <p className="text-xs text-muted-foreground">
        {rankedItems.length} of {maxSelections} selected
      </p>
    </div>
  );
}

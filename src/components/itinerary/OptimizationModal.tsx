'use client';

import { useState } from 'react';
import { Optimization } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Clock,
  ArrowRightLeft,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizationModalProps {
  isOpen: boolean;
  optimizations: Optimization[];
  onClose: () => void;
  onApplyOptimizations: (optimizationIds: string[]) => void;
  onSkip: () => void;
}

const optimizationIcons: Record<Optimization['type'], React.ReactNode> = {
  reorder: <ArrowRightLeft className="h-4 w-4" />,
  timing: <Clock className="h-4 w-4" />,
  cost_saving: <DollarSign className="h-4 w-4" />,
};

const optimizationColors: Record<Optimization['type'], string> = {
  reorder: 'bg-blue-50 text-blue-700 border-blue-200',
  timing: 'bg-purple-50 text-purple-700 border-purple-200',
  cost_saving: 'bg-green-50 text-green-700 border-green-200',
};

export function OptimizationModal({
  isOpen,
  optimizations,
  onClose,
  onApplyOptimizations,
  onSkip,
}: OptimizationModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    optimizations.map((o) => o.id) // All selected by default
  );

  const toggleOptimization = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleApply = () => {
    onApplyOptimizations(selectedIds);
  };

  const selectAll = () => {
    setSelectedIds(optimizations.map((o) => o.id));
  };

  const selectNone = () => {
    setSelectedIds([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Optimization Suggestions
          </DialogTitle>
          <DialogDescription>
            We found some ways to improve your itinerary. Select the ones you&apos;d like to apply.
          </DialogDescription>
        </DialogHeader>

        {/* Select All / None */}
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={selectAll}
            className="text-blue-600 hover:underline"
          >
            Select all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={selectNone}
            className="text-blue-600 hover:underline"
          >
            Select none
          </button>
        </div>

        {/* Optimizations List */}
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-3">
            {optimizations.map((optimization) => {
              const isSelected = selectedIds.includes(optimization.id);
              return (
                <div
                  key={optimization.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-colors',
                    isSelected
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => toggleOptimization(optimization.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOptimization(optimization.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', optimizationColors[optimization.type])}
                        >
                          {optimizationIcons[optimization.type]}
                          <span className="ml-1 capitalize">{optimization.type.replace('_', ' ')}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Day {optimization.dayNumber}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{optimization.message}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {optimization.impact}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedIds.length === 0}
          >
            Apply {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

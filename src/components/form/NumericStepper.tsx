'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface NumericStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function NumericStepper({
  label,
  value,
  min = 0,
  max = 20,
  onChange,
  disabled = false,
}: NumericStepperProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-medium tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

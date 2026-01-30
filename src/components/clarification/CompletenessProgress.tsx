'use client';

import { cn } from '@/lib/utils';

interface CompletenessProgressProps {
  score: number; // 0-100
  showLabel?: boolean;
}

export function CompletenessProgress({
  score,
  showLabel = true,
}: CompletenessProgressProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Profile completeness</span>
          <span className="font-medium">{Math.round(clampedScore)}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            clampedScore < 50
              ? 'bg-amber-500'
              : clampedScore < 80
                ? 'bg-blue-500'
                : 'bg-emerald-500'
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}

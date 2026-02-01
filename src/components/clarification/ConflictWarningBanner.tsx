'use client';

import { AlertTriangle } from 'lucide-react';

interface ConflictWarningBannerProps {
  conflicts: string[];
}

export function ConflictWarningBanner({ conflicts }: ConflictWarningBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            We noticed some conflicts in your preferences
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {conflicts.map((conflict, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                <span>{conflict}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            The following questions will help resolve these conflicts.
          </p>
        </div>
      </div>
    </div>
  );
}

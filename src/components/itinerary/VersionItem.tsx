'use client';

import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { ItineraryVersion } from '@/types/version';

interface VersionItemProps {
  version: ItineraryVersion;
  isCurrent?: boolean;
  onView: (version: ItineraryVersion) => void;
}

export function VersionItem({ version, isCurrent, onView }: VersionItemProps) {
  const time = format(parseISO(version.created_at), 'h:mm a');

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 rounded-lg transition-colors group">
      {/* Timeline dot */}
      <div className="relative flex items-center justify-center">
        <div
          className={`w-3 h-3 rounded-full ${
            isCurrent ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        />
        {/* Vertical line connector */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-200 group-last:hidden" />
      </div>

      {/* Version info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">
            v{version.version_number}
          </span>
          {isCurrent && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              Current
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <span className="text-sm text-slate-500 shrink-0">{time}</span>

      {/* View button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView(version)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    </div>
  );
}

'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { DayCardPreview } from './DayCardPreview';
import { Day } from '@/types';
import { MapPin } from 'lucide-react';

interface ItineraryPreviewProps {
  days: Day[];
  currentDayNumber?: number;
  destination?: string;
}

export function ItineraryPreview({ days, currentDayNumber, destination }: ItineraryPreviewProps) {
  const lockedDays = days.filter((day) => day.locked);

  if (lockedDays.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Your itinerary will appear here</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          As you plan each day, your locked choices will show up in this preview.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {destination && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{destination}</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {lockedDays.map((day) => (
            <DayCardPreview
              key={day.day_number}
              day={day}
              isActive={day.day_number === currentDayNumber}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/50">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Days planned</span>
          <span className="font-medium">
            {lockedDays.length} / {days.length || '?'}
          </span>
        </div>
      </div>
    </div>
  );
}

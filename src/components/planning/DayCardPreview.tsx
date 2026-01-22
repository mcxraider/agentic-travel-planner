'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Day } from '@/types';
import { Calendar, Clock, DollarSign, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayCardPreviewProps {
  day: Day;
  isActive?: boolean;
}

const energyLevelConfig = {
  light: { label: 'Light', color: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  strenuous: { label: 'Strenuous', color: 'bg-red-100 text-red-700' },
};

export function DayCardPreview({ day, isActive = false }: DayCardPreviewProps) {
  const energyConfig = energyLevelConfig[day.summary.energy_level] || {
    label: day.summary.energy_level,
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <Card className={cn('transition-all', isActive && 'ring-2 ring-primary')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Day {day.day_number}</CardTitle>
            {day.locked && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
          {day.theme && (
            <Badge variant="outline" className="text-xs">
              {day.theme}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(day.date), 'EEE, MMM d')}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Events list */}
        <div className="space-y-2">
          {day.events.slice(0, 4).map((event) => (
            <div key={event.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-mono text-xs w-12">
                {event.time_start}
              </span>
              <span className="truncate">{event.title}</span>
            </div>
          ))}
          {day.events.length > 4 && (
            <p className="text-xs text-muted-foreground">
              +{day.events.length - 4} more activities
            </p>
          )}
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {day.summary.active_hours}h active
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {day.summary.total_cost}
          </Badge>
          <Badge className={cn('text-xs flex items-center gap-1', energyConfig.color)}>
            <Zap className="h-3 w-3" />
            {energyConfig.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

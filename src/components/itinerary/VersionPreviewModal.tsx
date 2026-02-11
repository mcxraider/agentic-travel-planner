'use client';

import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Clock,
  MapPin,
  RotateCcw,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { ItineraryVersion } from '@/types/version';
import { getEventTypeConfig } from '@/config/event-types';

interface VersionPreviewModalProps {
  version: ItineraryVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: ItineraryVersion) => void;
  isRestoring?: boolean;
}

export function VersionPreviewModal({
  version,
  open,
  onOpenChange,
  onRestore,
  isRestoring = false,
}: VersionPreviewModalProps) {
  if (!version) return null;

  const { snapshot } = version;
  const createdAt = format(parseISO(version.created_at), 'MMM d, yyyy h:mm a');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Version {version.version_number}</span>
            <Badge variant="secondary" className="font-normal">
              {createdAt}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Preview of your itinerary at this version. Click restore to revert
            to this state.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Summary stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>{snapshot.days.length} days</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign className="h-4 w-4" />
                <span>${snapshot.metadata.total_cost.toLocaleString()}</span>
              </div>
            </div>

            {/* Days */}
            {snapshot.days.map((day) => (
              <div key={day.day_number} className="space-y-3">
                {/* Day header */}
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Day {day.day_number}
                  </h3>
                  <span className="text-sm text-slate-500">
                    {format(parseISO(day.date), 'EEE, MMM d')}
                  </span>
                  {day.theme && (
                    <Badge variant="outline" className="ml-2">
                      {day.theme}
                    </Badge>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                  {day.events
                    .filter((e) => e.isPrimaryAlternative !== false)
                    .map((event) => {
                      const config = getEventTypeConfig(event.type);
                      return (
                        <Card
                          key={event.id}
                          className="p-3 bg-slate-50 border-slate-200"
                        >
                          <div className="flex items-start gap-3">
                            {/* Time */}
                            <div className="flex items-center gap-1 text-xs text-slate-500 min-w-[90px]">
                              <Clock className="h-3 w-3" />
                              {event.time_start} - {event.time_end}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${config.colorClass}`}
                                >
                                  {event.type}
                                </Badge>
                                <span className="font-medium text-sm text-slate-900 truncate">
                                  {event.title}
                                </span>
                              </div>
                              {event.location?.name && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location.name}
                                </div>
                              )}
                            </div>

                            {/* Cost */}
                            {event.cost && event.cost.amount > 0 && (
                              <span className="text-xs text-slate-500">
                                ${event.cost.amount}
                              </span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => onRestore(version)}
            disabled={isRestoring}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isRestoring ? 'Restoring...' : 'Restore this version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

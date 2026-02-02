'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Ticket, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEventCard } from './EventCardContext';

interface EventCardMetadataDropdownProps {
  className?: string;
}

/**
 * Expandable dropdown showing additional event metadata.
 * Shows full address, booking required status, confirmation number, and notes.
 * Only renders if the event has metadata to display.
 */
export function EventCardMetadataDropdown({ className }: EventCardMetadataDropdownProps) {
  const { displayedEvent } = useEventCard();
  const [isExpanded, setIsExpanded] = useState(false);

  const { location, metadata } = displayedEvent;

  // Check if there's any metadata to display
  const hasAddress = location?.address;
  const hasBookingInfo = metadata?.booking_required || metadata?.confirmation_number;
  const hasNotes = metadata?.notes;
  const hasMetadata = hasAddress || hasBookingInfo || hasNotes;

  if (!hasMetadata) {
    return null;
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={cn('mt-2', className)}>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <>
            Hide details
            <ChevronUp className="ml-1 h-3 w-3" />
          </>
        ) : (
          <>
            Show details
            <ChevronDown className="ml-1 h-3 w-3" />
          </>
        )}
      </Button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 space-y-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          {/* Full address */}
          {hasAddress && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{location.address}</span>
            </div>
          )}

          {/* Booking info */}
          {hasBookingInfo && (
            <div className="flex items-start gap-2">
              <Ticket className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                {metadata.booking_required && (
                  <span className="font-medium text-amber-600">Booking required</span>
                )}
                {metadata.confirmation_number && (
                  <span className="block">
                    Confirmation: {metadata.confirmation_number}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {hasNotes && (
            <div className="flex items-start gap-2">
              <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{metadata.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { Event } from '@/types';

interface EventAlternativesResult {
  /**
   * Events to display in the main list (standalone events + one from each alternative group).
   * Sorted by time_start with order as tiebreaker.
   */
  primaryEvents: Event[];
  /**
   * Map of primary event ID -> array of alternative events in the same group.
   * Only includes groups that have alternatives (length > 0).
   */
  alternativesMap: Map<string, Event[]>;
}

/**
 * Groups events by their alternativeGroupId and separates them into primary events
 * (shown in the main list) and alternatives (available for cycling).
 *
 * For each alternative group, identifies the primary event (isPrimaryAlternative !== false)
 * or falls back to the first event if no primary is marked.
 *
 * @param events - Array of events to process (typically from a single day)
 * @returns primaryEvents (sorted) and alternativesMap
 *
 * @example
 * const { primaryEvents, alternativesMap } = useEventAlternatives(day.events);
 * primaryEvents.map(event => {
 *   const alternatives = alternativesMap.get(event.id) || [];
 *   // render event with alternatives...
 * });
 */
export function useEventAlternatives(events: Event[]): EventAlternativesResult {
  return useMemo(() => {
    const groups = new Map<string, Event[]>();
    const standaloneEvents: Event[] = [];

    // Group events by alternativeGroupId
    events.forEach((event) => {
      if (event.alternativeGroupId) {
        const existing = groups.get(event.alternativeGroupId) || [];
        groups.set(event.alternativeGroupId, [...existing, event]);
      } else {
        standaloneEvents.push(event);
      }
    });

    // For each group, find the primary and alternatives
    const primaryEvents: Event[] = [...standaloneEvents];
    const alternativesMap = new Map<string, Event[]>();

    groups.forEach((groupEvents) => {
      // Find primary (or first if no primary)
      const primary = groupEvents.find((e) => e.isPrimaryAlternative !== false) || groupEvents[0];
      const alternatives = groupEvents.filter((e) => e.id !== primary.id);
      primaryEvents.push(primary);
      if (alternatives.length > 0) {
        alternativesMap.set(primary.id, alternatives);
      }
    });

    // Sort by time_start (with order as tiebreaker for same start time)
    primaryEvents.sort((a, b) => a.time_start.localeCompare(b.time_start) || a.order - b.order);

    return { primaryEvents, alternativesMap };
  }, [events]);
}

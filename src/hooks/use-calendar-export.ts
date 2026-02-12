'use client';

import { useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useCalendarStore } from '@/store/calendar-store';
import { useItineraryStore } from '@/store/itinerary-store';
import { useTripStore } from '@/store/trip-store';
import {
  transformToBlockEvent,
  transformToDetailedEvents,
} from '@/lib/calendar/transformer';
import { useToast } from './use-toast';

export function useCalendarExport() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const {
    exportMode,
    selectedCalendarId,
    exportStatus,
    calendars,
    exportedEventCount,
    errorMessage,
    setCalendars,
    setSelectedCalendar,
    setExportStatus,
    setExportedEventCount,
    setErrorMessage,
  } = useCalendarStore();

  const itinerary = useItineraryStore((s) => s.itinerary);
  const tripData = useTripStore((s) => s.tripData);

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';

  const handleSignIn = useCallback(async () => {
    await signIn('google');
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  const fetchCalendars = useCallback(async () => {
    setExportStatus('fetching_calendars');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/calendar/calendars');
      const data = await res.json();

      if (data.items) {
        setCalendars(data.items);
        // Auto-select the primary calendar
        const primary = data.items.find(
          (c: { primary?: boolean }) => c.primary
        );
        if (primary) {
          setSelectedCalendar(primary.id);
        } else if (data.items.length > 0) {
          setSelectedCalendar(data.items[0].id);
        }
      }
      setExportStatus('idle');
    } catch {
      setErrorMessage('Failed to load calendars');
      setExportStatus('error');
    }
  }, [setCalendars, setSelectedCalendar, setExportStatus, setErrorMessage]);

  const executeExport = useCallback(async () => {
    if (!itinerary || !tripData || !selectedCalendarId) return;

    setExportStatus('exporting');
    setErrorMessage(null);

    try {
      const events =
        exportMode === 'block'
          ? [transformToBlockEvent(itinerary, tripData)]
          : transformToDetailedEvents(itinerary);

      const res = await fetch('/api/calendar/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: selectedCalendarId,
          events,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setExportedEventCount(data.successful || events.length);
        setExportStatus('success');
        const demoNote = data._demo ? ' (Demo mode)' : '';
        toast({
          title: 'Exported to Google Calendar' + demoNote,
          description: `${data.successful || events.length} event${(data.successful || events.length) > 1 ? 's' : ''} added`,
        });
      } else {
        setErrorMessage(data.error || 'Export failed');
        setExportStatus('error');
        toast({
          title: 'Export failed',
          description: data.error || 'Could not export events',
          variant: 'destructive',
        });
      }
    } catch {
      setErrorMessage('Network error during export');
      setExportStatus('error');
      toast({
        title: 'Export failed',
        description: 'Network error during export',
        variant: 'destructive',
      });
    }
  }, [
    itinerary,
    tripData,
    selectedCalendarId,
    exportMode,
    setExportStatus,
    setErrorMessage,
    setExportedEventCount,
    toast,
  ]);

  return {
    isAuthenticated,
    isLoading,
    handleSignIn,
    handleSignOut,
    calendars,
    selectedCalendarId,
    exportMode,
    exportStatus,
    exportedEventCount,
    errorMessage,
    fetchCalendars,
    executeExport,
  };
}

'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCalendarStore } from '@/store/calendar-store';
import { useCalendarExport } from '@/hooks/use-calendar-export';
import { Loader2, CheckCircle2, AlertCircle, CalendarPlus } from 'lucide-react';

export function CalendarExportModal() {
  const { isModalOpen, closeModal, exportMode, setExportMode } =
    useCalendarStore();

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    handleSignIn,
    calendars,
    selectedCalendarId,
    exportStatus,
    exportedEventCount,
    errorMessage,
    fetchCalendars,
    executeExport,
  } = useCalendarExport();

  const { setSelectedCalendar } = useCalendarStore();

  // Fetch calendars when modal opens and user is authenticated
  useEffect(() => {
    if (isModalOpen && isAuthenticated) {
      fetchCalendars();
    }
  }, [isModalOpen, isAuthenticated, fetchCalendars]);

  // Auto-close on success after 2 seconds
  useEffect(() => {
    if (exportStatus === 'success') {
      const timer = setTimeout(() => {
        closeModal();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [exportStatus, closeModal]);

  const isFetchingCalendars = exportStatus === 'fetching_calendars';
  const isExporting = exportStatus === 'exporting';

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
            Export to Google Calendar
          </DialogTitle>
          <DialogDescription>
            Add your trip events to Google Calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success State */}
          {exportStatus === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Successfully exported!
                </p>
                <p className="text-sm text-green-600">
                  {exportedEventCount} event
                  {exportedEventCount !== 1 ? 's' : ''} added to your calendar
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {exportStatus === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Export failed
                </p>
                <p className="text-sm text-red-600">
                  {errorMessage || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          )}

          {/* Auth Loading */}
          {isAuthLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {/* Unauthenticated State */}
          {!isAuthLoading && !isAuthenticated && exportStatus !== 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in with your Google account to export your itinerary to
                Google Calendar
              </p>
              <Button onClick={handleSignIn} className="gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}

          {/* Authenticated State - Export Options */}
          {isAuthenticated && exportStatus !== 'success' && (
            <>
              {/* Export Mode Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Export mode</Label>
                <RadioGroup
                  value={exportMode}
                  onValueChange={(value: string) =>
                    setExportMode(value as 'block' | 'detailed')
                  }
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="block" id="mode-block" className="mt-0.5" />
                    <Label htmlFor="mode-block" className="cursor-pointer">
                      <div className="font-medium text-sm">Block trip dates</div>
                      <div className="text-xs text-muted-foreground">
                        Single all-day event spanning your entire trip
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem
                      value="detailed"
                      id="mode-detailed"
                      className="mt-0.5"
                    />
                    <Label htmlFor="mode-detailed" className="cursor-pointer">
                      <div className="font-medium text-sm">Add all events</div>
                      <div className="text-xs text-muted-foreground">
                        Individual events with times and locations
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Calendar Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Calendar</Label>
                {isFetchingCalendars ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading calendars...
                    </span>
                  </div>
                ) : (
                  <Select
                    value={selectedCalendarId || ''}
                    onValueChange={setSelectedCalendar}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          <div className="flex items-center gap-2">
                            {cal.backgroundColor && (
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{
                                  backgroundColor: cal.backgroundColor,
                                }}
                              />
                            )}
                            {cal.summary}
                            {cal.primary && (
                              <span className="text-xs text-muted-foreground">
                                (Primary)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Export Button */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  onClick={executeExport}
                  disabled={
                    !selectedCalendarId ||
                    isExporting ||
                    isFetchingCalendars
                  }
                  className="gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

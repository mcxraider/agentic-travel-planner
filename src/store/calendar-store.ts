import { create } from 'zustand';

export interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface CalendarState {
  isModalOpen: boolean;
  exportMode: 'block' | 'detailed';
  selectedCalendarId: string | null;
  calendars: CalendarInfo[];
  exportStatus:
    | 'idle'
    | 'fetching_calendars'
    | 'exporting'
    | 'success'
    | 'error';
  errorMessage: string | null;
  exportedEventCount: number;
}

interface CalendarActions {
  openModal: () => void;
  closeModal: () => void;
  setExportMode: (mode: 'block' | 'detailed') => void;
  setSelectedCalendar: (calendarId: string) => void;
  setCalendars: (calendars: CalendarInfo[]) => void;
  setExportStatus: (status: CalendarState['exportStatus']) => void;
  setErrorMessage: (message: string | null) => void;
  setExportedEventCount: (count: number) => void;
  reset: () => void;
}

const initialState: CalendarState = {
  isModalOpen: false,
  exportMode: 'block',
  selectedCalendarId: null,
  calendars: [],
  exportStatus: 'idle',
  errorMessage: null,
  exportedEventCount: 0,
};

export const useCalendarStore = create<CalendarState & CalendarActions>()(
  (set) => ({
    ...initialState,

    openModal: () => set({ isModalOpen: true }),

    closeModal: () =>
      set({
        ...initialState,
        isModalOpen: false,
      }),

    setExportMode: (mode) => set({ exportMode: mode }),

    setSelectedCalendar: (calendarId) =>
      set({ selectedCalendarId: calendarId }),

    setCalendars: (calendars) => set({ calendars }),

    setExportStatus: (status) => set({ exportStatus: status }),

    setErrorMessage: (message) => set({ errorMessage: message }),

    setExportedEventCount: (count) => set({ exportedEventCount: count }),

    reset: () => set(initialState),
  })
);

import { create } from 'zustand';

export type LogCategory = 'user_action' | 'api_request' | 'api_response' | 'state_change' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: LogCategory;
  action: string;
  details?: Record<string, unknown>;
}

interface DebugState {
  logs: LogEntry[];
  isPanelOpen: boolean;
  persistToStorage: boolean;
}

interface DebugActions {
  log: (category: LogCategory, action: string, details?: Record<string, unknown>) => void;
  clearLogs: () => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setPersistToStorage: (persist: boolean) => void;
  loadLogsFromStorage: () => void;
}

const STORAGE_KEY = 'wandr_debug_logs';
const MAX_LOGS = 500; // Limit logs to prevent memory issues

const initialState: DebugState = {
  logs: [],
  isPanelOpen: false,
  persistToStorage: false,
};

// Load persist setting from localStorage
const loadPersistSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const setting = localStorage.getItem('wandr_debug_persist');
    return setting === 'true';
  } catch {
    return false;
  }
};

// Load logs from localStorage
const loadLogsFromStorage = (): LogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save logs to localStorage
const saveLogsToStorage = (logs: LogEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch {
    // Storage might be full, clear old logs
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const useDebugStore = create<DebugState & DebugActions>((set, get) => ({
  ...initialState,
  persistToStorage: typeof window !== 'undefined' ? loadPersistSetting() : false,

  log: (category, action, details) => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
    };

    set((state) => {
      const newLogs = [...state.logs, entry].slice(-MAX_LOGS);

      // Persist to storage if enabled
      if (state.persistToStorage) {
        saveLogsToStorage(newLogs);
      }

      return { logs: newLogs };
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${category.toUpperCase()}] ${action}`, details || '');
    }
  },

  clearLogs: () => {
    set({ logs: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setPersistToStorage: (persist) => {
    set({ persistToStorage: persist });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandr_debug_persist', persist.toString());

      if (persist) {
        // Save current logs when enabling
        saveLogsToStorage(get().logs);
      } else {
        // Clear stored logs when disabling
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  },

  loadLogsFromStorage: () => {
    const storedLogs = loadLogsFromStorage();
    if (storedLogs.length > 0) {
      set({ logs: storedLogs });
    }
  },
}));

// Custom hook for easy logging
export function useDebugLog() {
  const log = useDebugStore((state) => state.log);
  return log;
}

'use client';

import React, { useEffect, useState } from 'react';
import { useDebugStore, LogCategory } from '@/store/debug-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bug,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  User,
  Globe,
  Database,
  Settings,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

const categoryConfig: Record<LogCategory, { icon: React.ReactNode; color: string; label: string }> = {
  user_action: {
    icon: <User className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'User',
  },
  api_request: {
    icon: <Globe className="h-3 w-3" />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: 'Request',
  },
  api_response: {
    icon: <Globe className="h-3 w-3" />,
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'Response',
  },
  state_change: {
    icon: <Database className="h-3 w-3" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    label: 'State',
  },
  system: {
    icon: <Settings className="h-3 w-3" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'System',
  },
};

export function DebugPanel() {
  const {
    logs,
    isPanelOpen,
    persistToStorage,
    togglePanel,
    clearLogs,
    setPersistToStorage,
    loadLogsFromStorage,
    log,
  } = useDebugStore();

  // Load logs from storage on mount if persistence is enabled
  useEffect(() => {
    if (persistToStorage) {
      loadLogsFromStorage();
    }
    // Log that debug panel was initialized
    log('system', 'Debug panel initialized');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wandr-debug-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    log('user_action', 'Exported debug logs');
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={togglePanel}
        className={cn(
          'fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all',
          'bg-gray-900 text-white hover:bg-gray-800',
          isPanelOpen && 'bg-red-600 hover:bg-red-700'
        )}
        title={isPanelOpen ? 'Close debug panel' : 'Open debug panel'}
      >
        {isPanelOpen ? <X className="h-5 w-5" /> : <Bug className="h-5 w-5" />}
        {logs.length > 0 && !isPanelOpen && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {logs.length > 99 ? '99+' : logs.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isPanelOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[480px] max-h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Debug Panel</span>
              <Badge variant="outline" className="text-xs">
                {logs.length} logs
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleExportLogs} title="Export logs">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={clearLogs} title="Clear logs">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Persistence Toggle */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50">
            <span className="text-sm text-gray-600">Save to localStorage</span>
            <Switch
              checked={persistToStorage}
              onCheckedChange={setPersistToStorage}
            />
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px] max-h-[400px]">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <Bug className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No logs yet</p>
                <p className="text-xs">Actions will appear here</p>
              </div>
            ) : (
              [...logs].reverse().map((entry) => (
                <LogEntryItem key={entry.id} entry={entry} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              Logs are {persistToStorage ? 'persisted' : 'not persisted'} across page refreshes
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function LogEntryItem({ entry }: { entry: { id: string; timestamp: string; category: LogCategory; action: string; details?: Record<string, unknown> } }) {
  const config = categoryConfig[entry.category];
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <div className="rounded-md border bg-white p-2 text-sm">
      <div
        className={cn('flex items-start gap-2', hasDetails && 'cursor-pointer')}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <Badge variant="outline" className={cn('flex items-center gap-1 text-xs shrink-0', config.color)}>
          {config.icon}
          {config.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 break-words">{entry.action}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(entry.timestamp), 'HH:mm:ss.SSS')}
          </p>
        </div>
        {hasDetails && (
          <button className="shrink-0 p-1 hover:bg-gray-100 rounded">
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </button>
        )}
      </div>
      {isExpanded && hasDetails && (
        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto text-gray-600">
          {JSON.stringify(entry.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

'use client';

import { useServerHealth } from '@/hooks/use-server-health';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HealthStatusIndicatorProps {
  className?: string;
}

/**
 * Small circular indicator showing server health status.
 * Green with pulse animation when healthy, red when unhealthy, amber when checking.
 */
export function HealthStatusIndicator({ className }: HealthStatusIndicatorProps) {
  const { status, lastChecked, error } = useServerHealth();

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'unhealthy':
        return 'bg-red-500';
      case 'checking':
        return 'bg-amber-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'Server is healthy';
      case 'unhealthy':
        return 'Server is unavailable';
      case 'checking':
        return 'Checking server status...';
    }
  };

  const getLastCheckedText = () => {
    if (!lastChecked) return '';
    const seconds = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
    if (seconds < 60) return `Last checked ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `Last checked ${minutes}m ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative w-2.5 h-2.5 rounded-full cursor-default',
              getStatusColor(),
              className
            )}
          >
            {/* Pulse animation for healthy status */}
            {status === 'healthy' && (
              <span
                className={cn(
                  'absolute inset-0 rounded-full animate-ping',
                  'bg-green-500 opacity-75'
                )}
                style={{ animationDuration: '2s' }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm">
            <p className="font-medium">{getStatusText()}</p>
            {error && (
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            )}
            {lastChecked && (
              <p className="text-xs text-muted-foreground mt-1">
                {getLastCheckedText()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

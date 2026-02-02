'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ServerHealthState {
  status: 'healthy' | 'unhealthy' | 'checking';
  lastChecked: Date | null;
  error: string | null;
}

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const HEALTH_ENDPOINT = 'http://localhost:8000/health';

/**
 * Hook to monitor server health status.
 * Polls the health endpoint on mount and every 30 seconds.
 */
export function useServerHealth(): ServerHealthState {
  const [state, setState] = useState<ServerHealthState>({
    status: 'checking',
    lastChecked: null,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Short timeout to avoid blocking
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setState({
          status: 'healthy',
          lastChecked: new Date(),
          error: null,
        });
      } else {
        setState({
          status: 'unhealthy',
          lastChecked: new Date(),
          error: `Server returned status ${response.status}`,
        });
      }
    } catch (error) {
      setState({
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Failed to connect to server',
      });
    }
  }, []);

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up polling interval
    const intervalId = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkHealth]);

  return state;
}

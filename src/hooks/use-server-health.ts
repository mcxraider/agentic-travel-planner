'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ServerHealthState {
  status: 'healthy' | 'unhealthy' | 'checking';
  lastChecked: Date | null;
  error: string | null;
}

const HEALTHY_INTERVAL = 30000; // 30 seconds
const UNHEALTHY_INTERVAL = 3000; // 3 seconds
const HEALTH_ENDPOINT = 'http://localhost:8000/health';

/**
 * Hook to monitor server health status.
 * Polls the health endpoint with adaptive intervals:
 * - 30s when healthy
 * - 3s when unhealthy (for faster recovery detection)
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

  // Initial health check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Adaptive polling based on current status
  useEffect(() => {
    const interval = state.status === 'unhealthy' ? UNHEALTHY_INTERVAL : HEALTHY_INTERVAL;
    const intervalId = setInterval(checkHealth, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkHealth, state.status]);

  return state;
}

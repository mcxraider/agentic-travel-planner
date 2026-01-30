'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ApiErrorProps {
  message: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export function ApiError({
  message,
  onRetry,
  isNetworkError = false,
}: ApiErrorProps) {
  const Icon = isNetworkError ? WifiOff : AlertCircle;
  const title = isNetworkError ? 'Connection Error' : 'Error';

  return (
    <Alert variant="destructive">
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

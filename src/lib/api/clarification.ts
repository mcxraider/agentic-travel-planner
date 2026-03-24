import { API_ENDPOINTS } from '@/lib/constants';
import { API_BASE_URL_LABEL } from '@/lib/env';
import {
  StartSessionRequest,
  StartSessionResponse,
  RespondResponse,
} from '@/types';
import { ApiError, createFetchAdapter } from './adapters';

/**
 * Custom error class for clarification API errors.
 * Extends the base ApiError for domain-specific handling.
 */
export class ClarificationApiError extends ApiError {
  constructor(
    message: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message, statusCode, details);
    this.name = 'ClarificationApiError';
  }
}

/**
 * Clarification-specific fetch adapter with preset error messages.
 */
const clarificationFetch = createFetchAdapter({
  networkErrorMessage: `Backend not responding. Please ensure the server is running at ${API_BASE_URL_LABEL}`,
});

/**
 * Start a new clarification session
 * POST /api/clarification/start
 */
export async function startClarificationSession(
  request: StartSessionRequest
): Promise<StartSessionResponse> {
  try {
    return await clarificationFetch<StartSessionResponse>(API_ENDPOINTS.clarificationStart, {
      method: 'POST',
      body: request,
      errorMessagePrefix: 'Failed to start session',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ClarificationApiError(error.message, error.statusCode, error.details);
    }
    throw error;
  }
}

/**
 * Submit responses for the current round
 * POST /api/clarification/respond
 */
export async function submitClarificationResponses(
  sessionId: string,
  responses: Record<string, unknown>
): Promise<RespondResponse> {
  try {
    return await clarificationFetch<RespondResponse>(API_ENDPOINTS.clarificationRespond, {
      method: 'POST',
      body: {
        session_id: sessionId,
        responses,
      },
      errorMessagePrefix: 'Failed to submit responses',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle specific error codes with custom messages
      if (error.isStatus(404)) {
        throw new ClarificationApiError(
          'Session not found. Please restart the clarification process.',
          404
        );
      }
      if (error.isStatus(422)) {
        throw new ClarificationApiError(
          `Validation error: ${error.details || error.message}`,
          422,
          error.details
        );
      }
      throw new ClarificationApiError(error.message, error.statusCode, error.details);
    }
    throw error;
  }
}

/**
 * Session status response type
 */
interface SessionStatus {
  exists: boolean;
  current_round?: number;
  completeness_score?: number;
  clarification_complete?: boolean;
}

/**
 * Check session status (optional, for resume functionality)
 * GET /api/clarification/session/{id}
 */
export async function checkSessionStatus(sessionId: string): Promise<SessionStatus> {
  try {
    return await clarificationFetch<SessionStatus>(
      `${API_ENDPOINTS.clarificationSession}/${sessionId}`,
      {
        method: 'GET',
        errorMessagePrefix: 'Failed to check session status',
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      // 404 means session doesn't exist - not an error for this use case
      if (error.isStatus(404)) {
        return { exists: false };
      }
      throw new ClarificationApiError(error.message, error.statusCode, error.details);
    }
    throw error;
  }
}

/**
 * Delete/cancel a session
 * DELETE /api/clarification/session/{id}
 */
export async function cancelSession(sessionId: string): Promise<void> {
  try {
    await clarificationFetch<void>(
      `${API_ENDPOINTS.clarificationSession}/${sessionId}`,
      {
        method: 'DELETE',
        errorMessagePrefix: 'Failed to cancel session',
      }
    );
  } catch (error) {
    // 404 is acceptable - session already doesn't exist
    if (error instanceof ApiError && error.isStatus(404)) {
      return;
    }
    // Silently ignore network errors when canceling (best-effort cleanup)
    if (!(error instanceof ApiError)) {
      return;
    }
    throw new ClarificationApiError(
      (error as ApiError).message,
      (error as ApiError).statusCode,
      (error as ApiError).details
    );
  }
}

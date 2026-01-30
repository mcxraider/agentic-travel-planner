// Clarification API types based on backend contract

/**
 * A single clarification question from the backend.
 */
export interface ClarificationQuestion {
  question_id: number;
  field: string;
  multi_select: boolean;
  question_text: string;
  options: string[];
  allow_custom_input: boolean;
}

/**
 * Progress/state info returned with questions.
 */
export interface QuestionsState {
  answered_fields: string[];
  missing_fields: string[];
  completeness_score: number; // 0-100
}

/**
 * POST /api/clarification/start - Request body
 */
export interface StartSessionRequest {
  // User Profile
  user_name: string;
  citizenship?: string;
  health_limitations?: string | null;
  work_obligations?: string | null;
  dietary_restrictions?: string | null;
  specific_interests?: string[] | null;

  // Trip Basics
  destination: string;
  destination_cities?: string[] | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  budget: number;
  currency?: string;
  travel_party?: string;
  budget_scope?: string;
}

/**
 * POST /api/clarification/start - Response
 */
export interface StartSessionResponse {
  session_id: string;
  round: number;
  questions: ClarificationQuestion[];
  state: QuestionsState;
}

/**
 * POST /api/clarification/respond - Request body
 */
export interface RespondRequest {
  session_id: string;
  responses: Record<string, unknown>; // field -> value (string | string[])
}

/**
 * POST /api/clarification/respond - Response
 */
export interface RespondResponse {
  session_id: string;
  complete: boolean;

  // Present when complete = false
  round?: number;
  questions?: ClarificationQuestion[];
  state?: QuestionsState;

  // Present when complete = true
  collected_data?: Record<string, unknown>;
}

/**
 * GET /api/clarification/session/{id} - Response
 */
export interface SessionStatusResponse {
  session_id: string;
  exists: boolean;
  current_round?: number;
  completeness_score?: number;
  clarification_complete?: boolean;
}

/**
 * Clarification store state
 */
export interface ClarificationState {
  status: 'idle' | 'in_progress' | 'complete';
  sessionId: string | null;
  currentRound: number;
  questions: ClarificationQuestion[];
  answers: Record<string, string | string[]>; // field -> selected value(s)
  completenessScore: number;
  collectedData: Record<string, unknown> | null;
  error: string | null;
}

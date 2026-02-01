// Clarification API types based on backend contract v2

/**
 * Question types supported by the v2 API.
 */
export type QuestionType = 'single_select' | 'multi_select' | 'ranked' | 'text';

/**
 * A single clarification question from the backend.
 */
export interface Question {
  id: string;
  field: string;
  type: QuestionType;
  question: string;
  options: string[];
  allow_custom: boolean;
  tier: 1 | 2 | 3 | 4;
  min_selections?: number;
  max_selections?: number;
}

/**
 * Progress/state info returned with questions.
 */
export interface QuestionsState {
  collected: string[];
  missing_tier1: string[];
  missing_tier2: string[];
  score: number; // 0-100
  conflicts_detected: string[];
}

/**
 * All collected clarification data fields.
 */
export interface ClarificationData {
  // User Profile
  user_name?: string;
  citizenship?: string;
  health_limitations?: string | null;
  work_obligations?: string | null;
  dietary_restrictions?: string | null;
  specific_interests?: string[] | null;

  // Trip Basics
  destination?: string;
  destination_cities?: string[] | null;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  travel_party?: string;
  budget_scope?: string;

  // Travel Style Preferences
  pace_preference?: string;
  accommodation_type?: string;
  transport_preference?: string[] | null;

  // Trip Planning
  top_3_must_dos?: Record<string, string>; // {"1": "...", "2": "...", "3": "..."}
  deal_breakers?: string[] | null;
  time_constraints?: string | null;

  // Special Needs (conditional fields)
  accessibility_needs?: string | null;
  child_friendly?: boolean | null;
  pet_friendly?: boolean | null;

  // Internal fields
  _warnings?: string[];
  _conflicts_resolved?: boolean;

  // Allow additional fields
  [key: string]: unknown;
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
  questions: Question[];
  state: QuestionsState;
  data: ClarificationData;
}

/**
 * POST /api/clarification/respond - Request body
 */
export interface RespondRequest {
  session_id: string;
  responses: Record<string, unknown>; // field -> value (string | string[] | ranked object)
}

/**
 * POST /api/clarification/respond - Response
 */
export interface RespondResponse {
  session_id: string;
  complete: boolean;
  round: number;
  questions: Question[];
  state: QuestionsState;
  data: ClarificationData;
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
  questions: Question[];
  answers: Record<string, unknown>; // field -> selected value(s) or ranked object
  questionsState: QuestionsState | null;
  data: ClarificationData | null;
  error: string | null;
}

// Legacy type alias for backwards compatibility during migration
export type ClarificationQuestion = Question;

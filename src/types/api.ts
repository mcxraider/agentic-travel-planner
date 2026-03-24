import { TripData, UserProfile, PlanningPhase } from './trip';
import { Itinerary, Event, Conflict } from './itinerary';
import { Option } from './chat';

// Chat API
export interface ChatRequest {
  message: string;
  conversation_id: string;
  context: {
    current_phase: PlanningPhase;
    clarification_step?: number;
    current_day?: number;
    total_days?: number;
    trip_data?:
      | Partial<TripData>
      | {
          destination?: string;
          startDate?: string;
        };
  };
}

export interface ChatResponse {
  message: string;
  type: 'info' | 'question' | 'options' | 'confirmation';
  options?: Option[];
  next_phase?: PlanningPhase;
  updated_state?: Partial<{
    trip_data: TripData;
    user_profile: UserProfile;
  }>;
}

// Generate Day API
export interface GenerateDayRequest {
  trip_id: string;
  day_number: number;
  user_profile: UserProfile;
  research_context?: Record<string, unknown>;
}

export interface GenerateDayResponse {
  day_number: number;
  options: DayOption[];
}

export interface DayOption {
  id: string;
  title: string;
  events: Event[];
}

// Validate Edit API
export interface ValidateEditRequest {
  itinerary: Itinerary;
  edit_action: EditAction;
}

export interface EditAction {
  type: 'move' | 'delete' | 'add' | 'reorder';
  event_id: string;
  from_day?: number;
  to_day?: number;
  new_order?: number;
}

export interface ValidateEditResponse {
  valid: boolean;
  conflicts: Conflict[];
  suggestions: Suggestion[];
  updated_itinerary?: Itinerary;
}

// Using Conflict from itinerary.ts

export interface Suggestion {
  id: string;
  description: string;
  impact: string;
}

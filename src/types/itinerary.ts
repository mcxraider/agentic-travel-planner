export interface Itinerary {
  trip_id: string;
  days: Day[];
  metadata: {
    total_cost: number;
    total_days: number;
    locked: boolean;
  };
}

export interface Day {
  day_number: number;
  date: string;
  theme?: string; // "Arrival", "Hiking", "Cultural", etc.
  events: Event[];
  summary: {
    total_cost: number;
    active_hours: number;
    rest_hours: number;
    energy_level: 'light' | 'moderate' | 'strenuous';
  };
  locked: boolean;
}

export interface Event {
  id: string;
  order: number;
  time_start: string; // "14:00"
  time_end: string;
  duration_minutes: number;
  type: 'logistics' | 'activity' | 'dining' | 'transit' | 'rest';
  category: string;
  title: string;
  description: string;
  location?: EventLocation;
  cost?: EventCost;
  metadata: EventMetadata;
  // Alternative grouping - events with same groupId are alternatives to each other
  alternativeGroupId?: string;
  isPrimaryAlternative?: boolean; // If true, this is the default shown option
}

export interface EventLocation {
  name: string;
  address: string;
  coordinates: [number, number];
  google_place_id?: string;
}

export interface EventCost {
  amount: number;
  currency: string;
  category: string;
}

export interface EventMetadata {
  booking_required: boolean;
  confirmation_number?: string;
  notes?: string;
  weather_dependent: boolean;
}

export interface Alternative {
  title: string;
  reason_not_chosen: string;
  would_save_cost?: number;
  would_save_time?: number;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  conflicts: Conflict[];
  optimizations: Optimization[];
}

export interface Conflict {
  id: string;
  type: 'time_overlap' | 'too_many_activities' | 'high_energy_consecutive';
  severity: 'warning' | 'error';
  dayNumber: number;
  eventIds: string[];
  message: string;
  suggestion?: ConflictSuggestion;
}

export interface ConflictSuggestion {
  id: string;
  description: string;
  action: 'remove' | 'move' | 'swap' | 'shorten' | 'make_alternative';
  targetEventId?: string;
  targetDay?: number;
}

export interface Optimization {
  id: string;
  type: 'reorder' | 'timing' | 'cost_saving';
  dayNumber: number;
  message: string;
  impact: string;
  suggestion: OptimizationSuggestion;
}

export interface OptimizationSuggestion {
  id: string;
  description: string;
  action: 'reorder' | 'reschedule' | 'swap_day';
  targetEventId?: string;
  newTime?: string;
  newDay?: number;
}

export interface DayWarning {
  id: string;
  dayNumber: number;
  message: string;
  conflictType: Conflict['type'];
}

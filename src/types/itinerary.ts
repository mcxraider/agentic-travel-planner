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
  alternatives?: Alternative[];
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

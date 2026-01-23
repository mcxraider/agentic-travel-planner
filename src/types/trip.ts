export type BudgetCategory = 'budget' | 'moderate' | 'luxury';
export type TripFocus = 'hiking' | 'adventure' | 'cultural' | 'relaxation';

export interface TripData {
  id: string;
  destination: string; // Primary destination (first in list) for backwards compatibility
  destinations: string[]; // All destinations for multi-city trips (max 10)
  startDate: string; // ISO format
  endDate: string;
  budgetCategory: BudgetCategory;
  focus: TripFocus[];
  travelers: number;
  canDrive: boolean; // Whether the user can drive
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  departure_city?: string;
  hiking_level?: 'beginner' | 'intermediate' | 'advanced';
  pace_preference?: 'relaxed' | 'moderate' | 'packed';
  dietary_restrictions?: string[];
  interests?: string[];
}

export type PlanningPhase = 'input' | 'clarification' | 'planning' | 'review' | 'editing';

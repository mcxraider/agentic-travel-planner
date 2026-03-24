import { BACKEND_ENDPOINTS } from '@/lib/env';

// App constants
export const APP_NAME = 'Trip Planner AI';

// Planning phases
export const PLANNING_PHASES = [
  { id: 'input', label: 'Trip Details' },
  { id: 'clarification', label: 'Preferences' },
  { id: 'research', label: 'Research' },
  { id: 'planning', label: 'Day Planning' },
  { id: 'review', label: 'Review' },
] as const;

// Budget categories
export const BUDGET_CATEGORIES = [
  { value: 'budget', label: 'Budget', description: 'Cost-conscious travel' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced comfort and cost' },
  { value: 'luxury', label: 'Luxury', description: 'Premium experiences' },
] as const;

// Trip focus options (multi-select)
export const TRIP_FOCUS_OPTIONS = [
  { value: 'hiking', label: 'Hiking' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxation', label: 'Relaxation' },
] as const;

// Hiking levels
export const HIKING_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

// Pace preferences
export const PACE_PREFERENCES = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'packed', label: 'Packed' },
] as const;

// Energy levels
export const ENERGY_LEVELS = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strenuous', label: 'Strenuous' },
] as const;

// Event types
export const EVENT_TYPES = [
  { value: 'logistics', label: 'Logistics' },
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'transit', label: 'Transit' },
  { value: 'rest', label: 'Rest' },
] as const;

// Default currency
export const DEFAULT_CURRENCY = 'USD';

// Currency options for trip budget
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
  { value: 'JPY', label: 'JPY (\u00A5)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'CNY', label: 'CNY (\u00A5)' },
  { value: 'KRW', label: 'KRW (\u20A9)' },
] as const;

// Budget scope options
export const BUDGET_SCOPE_OPTIONS = [
  { value: 'Total trip budget', label: 'Total trip budget' },
  { value: 'Per person budget', label: 'Per person budget' },
  { value: 'Daily budget', label: 'Daily budget' },
] as const;

// API endpoints
export const API_ENDPOINTS = {
  // Mock endpoints (existing)
  chat: '/api/mock/chat',
  generateDay: '/api/mock/generate-day',
  validateEdit: '/api/mock/validate-edit',
  // Real backend endpoints
  clarificationStart: BACKEND_ENDPOINTS.clarificationStart,
  clarificationRespond: BACKEND_ENDPOINTS.clarificationRespond,
  clarificationSession: BACKEND_ENDPOINTS.clarificationSession,
} as const;

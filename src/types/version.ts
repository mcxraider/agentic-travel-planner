import { Itinerary } from './itinerary';

/**
 * Represents a saved version of an itinerary
 */
export interface ItineraryVersion {
  /** Unique version identifier (e.g., "ver_1706785643210") */
  id: string;
  /** Incremental version number (1, 2, 3...) */
  version_number: number;
  /** Associated trip ID */
  trip_id: string;
  /** Full itinerary snapshot at this version */
  snapshot: Itinerary;
  /** ISO timestamp when version was created */
  created_at: string;
}

/**
 * Response from version history API
 */
export interface VersionHistoryResponse {
  versions: ItineraryVersion[];
  current_version: number;
}

/**
 * Request to create a new version
 */
export interface CreateVersionRequest {
  trip_id: string;
  snapshot: Itinerary;
}

/**
 * Response after creating a version
 */
export interface CreateVersionResponse {
  version: ItineraryVersion;
}

/**
 * Versions grouped by date for display
 */
export interface VersionGroup {
  /** Display label (e.g., "Today", "Yesterday", "Jan 30, 2026") */
  label: string;
  /** Date key for sorting (ISO date string) */
  date: string;
  /** Versions in this group, sorted by newest first */
  versions: ItineraryVersion[];
}

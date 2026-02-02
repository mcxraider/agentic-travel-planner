import { NextRequest, NextResponse } from 'next/server';
import type {
  ItineraryVersion,
  VersionHistoryResponse,
  CreateVersionRequest,
  CreateVersionResponse
} from '@/types/version';

// In-memory storage for versions (simulates database)
const versionsStore: Map<string, ItineraryVersion[]> = new Map();

/**
 * GET /api/mock/versions?trip_id={id}
 * Fetch version history for a trip
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('trip_id');

  if (!tripId) {
    return NextResponse.json(
      { error: 'trip_id is required' },
      { status: 400 }
    );
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const versions = versionsStore.get(tripId) || [];
  const currentVersion = versions.length > 0
    ? Math.max(...versions.map(v => v.version_number))
    : 0;

  const response: VersionHistoryResponse = {
    versions: [...versions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    current_version: currentVersion,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/mock/versions
 * Create a new version
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateVersionRequest = await request.json();
    const { trip_id, snapshot } = body;

    if (!trip_id || !snapshot) {
      return NextResponse.json(
        { error: 'trip_id and snapshot are required' },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get existing versions or initialize
    const existingVersions = versionsStore.get(trip_id) || [];

    // Calculate next version number
    const nextVersionNumber = existingVersions.length > 0
      ? Math.max(...existingVersions.map(v => v.version_number)) + 1
      : 1;

    // Create new version
    const newVersion: ItineraryVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      version_number: nextVersionNumber,
      trip_id,
      snapshot: JSON.parse(JSON.stringify(snapshot)), // Deep clone
      created_at: new Date().toISOString(),
    };

    // Store the new version
    versionsStore.set(trip_id, [...existingVersions, newVersion]);

    const response: CreateVersionResponse = {
      version: newVersion,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mock/versions?trip_id={id}
 * Clear all versions for a trip (for testing)
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('trip_id');

  if (!tripId) {
    return NextResponse.json(
      { error: 'trip_id is required' },
      { status: 400 }
    );
  }

  versionsStore.delete(tripId);

  return NextResponse.json({ success: true });
}

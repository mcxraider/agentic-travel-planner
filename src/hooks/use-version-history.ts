'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ItineraryVersion,
  VersionHistoryResponse,
  CreateVersionRequest,
  CreateVersionResponse,
  VersionGroup,
} from '@/types/version';
import type { Itinerary } from '@/types/itinerary';
import { useItineraryStore } from '@/store';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Groups versions by date for display
 */
function groupVersionsByDate(versions: ItineraryVersion[]): VersionGroup[] {
  const groups: Map<string, ItineraryVersion[]> = new Map();

  versions.forEach((version) => {
    const date = parseISO(version.created_at);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(version);
  });

  // Convert to array and add labels
  const result: VersionGroup[] = [];

  groups.forEach((versions, dateKey) => {
    const date = parseISO(dateKey);
    let label: string;

    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else {
      label = format(date, 'MMM d, yyyy');
    }

    result.push({
      label,
      date: dateKey,
      versions: versions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    });
  });

  // Sort groups by date (newest first)
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Hook for managing itinerary version history
 */
export function useVersionHistory(tripId: string | null) {
  const queryClient = useQueryClient();
  const { setItinerary, setCurrentVersion } = useItineraryStore();
  const [previewVersion, setPreviewVersion] = useState<ItineraryVersion | null>(null);

  // Fetch version history
  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useQuery<VersionHistoryResponse>({
    queryKey: ['versions', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error('No trip ID');
      const response = await fetch(`/api/mock/versions?trip_id=${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    },
    enabled: !!tripId,
  });

  // Create version mutation
  const createVersionMutation = useMutation<CreateVersionResponse, Error, CreateVersionRequest>({
    mutationFn: async (request) => {
      const response = await fetch('/api/mock/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to create version');
      return response.json();
    },
    onSuccess: (data) => {
      // Update current version in store
      setCurrentVersion(data.version.version_number);
      // Invalidate the versions query to refetch
      queryClient.invalidateQueries({ queryKey: ['versions', tripId] });
    },
  });

  // Create a new version
  const createVersion = useCallback(
    async (snapshot: Itinerary) => {
      if (!tripId) return null;
      const result = await createVersionMutation.mutateAsync({
        trip_id: tripId,
        snapshot,
      });
      return result.version;
    },
    [tripId, createVersionMutation]
  );

  // Restore a version (makes it the current itinerary and creates a new version)
  const restoreVersion = useCallback(
    async (version: ItineraryVersion) => {
      // Set the snapshot as the current itinerary
      setItinerary(JSON.parse(JSON.stringify(version.snapshot)));
      // Create a new version from the restored state
      await createVersion(version.snapshot);
      // Close preview
      setPreviewVersion(null);
    },
    [setItinerary, createVersion]
  );

  // Open preview modal
  const openPreview = useCallback((version: ItineraryVersion) => {
    setPreviewVersion(version);
  }, []);

  // Close preview modal
  const closePreview = useCallback(() => {
    setPreviewVersion(null);
  }, []);

  // Get grouped versions for display
  const groupedVersions = historyData?.versions
    ? groupVersionsByDate(historyData.versions)
    : [];

  return {
    // Data
    versions: historyData?.versions || [],
    groupedVersions,
    currentVersion: historyData?.current_version || 0,
    previewVersion,

    // Status
    isLoading,
    isCreating: createVersionMutation.isPending,
    error,

    // Actions
    createVersion,
    restoreVersion,
    openPreview,
    closePreview,
    refetch,
  };
}

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useItineraryStore, useTripStore } from '@/store';
import { ItineraryProvider, ItineraryContextValue } from '@/contexts';
import { useItineraryEdit, useVersionHistory } from '@/hooks';
import {
  ItineraryHeader,
  TimelineView,
  EditChatSidebar,
  AddEventForm,
  EditEventForm,
  OptimizationModal,
  AddAlternativeForm,
  VersionHistoryDrawer,
  VersionPreviewModal,
} from '@/components/itinerary';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ItineraryPage() {
  const router = useRouter();

  const { tripData } = useTripStore();
  const {
    itinerary,
    selectedEventIds,
    editSidebarOpen,
    hasUnsavedChanges,
    undoStack,
    warnings,
    eventConflicts,
    visualSelections,
    currentVersion,
    setEditSidebarOpen,
    clearSelection,
  } = useItineraryStore();

  // Version history state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const tripId = itinerary?.trip_id || null;

  const {
    groupedVersions,
    currentVersion: apiCurrentVersion,
    previewVersion,
    isLoading: versionsLoading,
    isCreating: isCreatingVersion,
    createVersion,
    restoreVersion,
    openPreview,
    closePreview,
  } = useVersionHistory(tripId);

  // Use the extracted hook for all editing logic
  const {
    isValidating,
    pendingConflicts,
    showSaveConfirmDialog,
    optimizations,
    showOptimizationModal,
    addEventDayNumber,
    addAlternativeEvent,
    editEventData,
    handleSelectEvent,
    handleDeleteEvent,
    handleDeleteSelected,
    handleMoveEvent,
    handleAddEvent,
    handleDragStart,
    handleOpenAddAlternative,
    handleCloseAddAlternative,
    handleAddAlternative,
    handleVisualSelectionChange,
    handleApplyChanges,
    handleConfirmSaveWithConflicts,
    handleCancelSave,
    handleDismissConflict,
    handleDismissWarning,
    handleOptimize,
    handleApplyOptimizations,
    handleSkipOptimizations,
    handleUndo,
    handleOpenEditEvent,
    handleCloseEditEvent,
    handleEditEvent,
    handleOpenAddEvent,
    handleCloseAddEvent,
  } = useItineraryEdit();

  const [isLoading, setIsLoading] = useState(true);

  // Wrap handleApplyChanges to also create a version
  const handleApplyChangesWithVersion = useCallback(async () => {
    // First apply changes (this does validation)
    await handleApplyChanges();

    // After successful apply, create a new version
    if (itinerary) {
      await createVersion(itinerary);
    }
  }, [handleApplyChanges, itinerary, createVersion]);

  // Wrap confirm save with conflicts to also create a version
  const handleConfirmSaveWithConflictsWithVersion = useCallback(async () => {
    handleConfirmSaveWithConflicts();

    // Create version after confirming save with conflicts
    if (itinerary) {
      await createVersion(itinerary);
    }
  }, [handleConfirmSaveWithConflicts, itinerary, createVersion]);

  // Check if we have the necessary data
  useEffect(() => {
    // Small delay to allow store hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut for undo (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (undoStack.length > 0) {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, undoStack.length]);

  // Build context value for ItineraryProvider
  const contextValue: ItineraryContextValue = useMemo(
    () => ({
      // State
      itinerary,
      selectedEventIds,
      eventConflicts,
      visualSelections,
      warnings,
      hasUnsavedChanges,
      canUndo: undoStack.length > 0,

      // Event actions
      selectEvent: handleSelectEvent,
      deleteEvent: handleDeleteEvent,
      moveEvent: handleMoveEvent,

      // Modal triggers
      openAddEvent: handleOpenAddEvent,
      openAddAlternative: handleOpenAddAlternative,
      openEditEvent: handleOpenEditEvent,

      // Visual selection for cycling
      cycleAlternative: handleVisualSelectionChange,

      // Dismiss actions
      dismissConflict: handleDismissConflict,
      dismissWarning: handleDismissWarning,

      // Drag-drop
      onDragStart: handleDragStart,
    }),
    [
      itinerary,
      selectedEventIds,
      eventConflicts,
      visualSelections,
      warnings,
      hasUnsavedChanges,
      undoStack.length,
      handleSelectEvent,
      handleDeleteEvent,
      handleMoveEvent,
      handleOpenAddEvent,
      handleOpenAddAlternative,
      handleOpenEditEvent,
      handleVisualSelectionChange,
      handleDismissConflict,
      handleDismissWarning,
      handleDragStart,
    ]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No data state
  if (!itinerary || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Itinerary Found</h1>
          <p className="text-muted-foreground mb-4">
            It looks like you haven&apos;t created an itinerary yet.
          </p>
          <button
            onClick={() => router.push('/plan')}
            className="text-blue-600 hover:underline"
          >
            Start planning your trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ItineraryHeader
        tripData={tripData}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={undoStack.length > 0}
        isSidebarOpen={editSidebarOpen}
        isValidating={isValidating || isCreatingVersion}
        currentVersion={currentVersion ?? apiCurrentVersion}
        onApplyChanges={handleApplyChangesWithVersion}
        onOptimize={handleOptimize}
        onUndo={handleUndo}
        onToggleSidebar={() => setEditSidebarOpen(!editSidebarOpen)}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          editSidebarOpen ? 'mr-96' : 'mr-0'
        )}
      >
        <main className="max-w-4xl mx-auto px-6 py-6">
          {/* Wrap TimelineView with ItineraryProvider - no props needed! */}
          <ItineraryProvider value={contextValue}>
            <TimelineView />
          </ItineraryProvider>
        </main>
      </div>

      {/* Edit Chat Sidebar */}
      <EditChatSidebar
        isOpen={editSidebarOpen}
        itinerary={itinerary}
        selectedEventIds={selectedEventIds}
        onClose={() => setEditSidebarOpen(false)}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Event Dialog */}
      <AddEventForm
        isOpen={addEventDayNumber !== null}
        dayNumber={addEventDayNumber || 1}
        onClose={handleCloseAddEvent}
        onAddEvent={handleAddEvent}
      />

      {/* Edit Event Dialog */}
      <EditEventForm
        isOpen={editEventData !== null}
        event={editEventData?.event || null}
        dayNumber={editEventData?.dayNumber || 1}
        onClose={handleCloseEditEvent}
        onEditEvent={handleEditEvent}
      />

      {/* Add Alternative Dialog */}
      <AddAlternativeForm
        isOpen={addAlternativeEvent !== null}
        primaryEvent={addAlternativeEvent?.event || null}
        dayNumber={addAlternativeEvent?.dayNumber || 1}
        onClose={handleCloseAddAlternative}
        onAddAlternative={handleAddAlternative}
      />

      {/* Save with Conflicts Confirmation Dialog */}
      <AlertDialog open={showSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save with conflicts?</AlertDialogTitle>
            <AlertDialogDescription>
              Your itinerary has {pendingConflicts.length} conflict{pendingConflicts.length > 1 ? 's' : ''} that haven&apos;t been resolved.
              Conflicting events are highlighted in red. You can save anyway and address them later, or go back to fix them now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>
              Go back and fix
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveWithConflictsWithVersion}>
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={showOptimizationModal}
        optimizations={optimizations}
        onClose={handleSkipOptimizations}
        onApplyOptimizations={handleApplyOptimizations}
        onSkip={handleSkipOptimizations}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        groupedVersions={groupedVersions}
        currentVersion={currentVersion ?? apiCurrentVersion}
        isLoading={versionsLoading}
        onViewVersion={openPreview}
      />

      {/* Version Preview Modal */}
      <VersionPreviewModal
        version={previewVersion}
        open={previewVersion !== null}
        onOpenChange={(open) => !open && closePreview()}
        onRestore={restoreVersion}
        isRestoring={isCreatingVersion}
      />
    </div>
  );
}

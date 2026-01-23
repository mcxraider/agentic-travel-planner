'use client';

import { useState } from 'react';
import { Conflict } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  XCircle,
  Check,
  X,
  CheckCheck,
  XSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationModalProps {
  isOpen: boolean;
  conflicts: Conflict[];
  onClose: () => void;
  onAcceptSuggestion: (conflictId: string) => void;
  onRejectSuggestion: (conflictId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSaveWithWarnings: (unresolvedConflicts: Conflict[]) => void;
}

interface ConflictDecision {
  conflictId: string;
  accepted: boolean | null; // null = undecided
}

export function ValidationModal({
  isOpen,
  conflicts,
  onClose,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAcceptAll,
  onRejectAll,
  onSaveWithWarnings,
}: ValidationModalProps) {
  const [decisions, setDecisions] = useState<ConflictDecision[]>(
    conflicts.map((c) => ({ conflictId: c.id, accepted: null }))
  );

  // Update decisions when conflicts change
  useState(() => {
    setDecisions(conflicts.map((c) => ({ conflictId: c.id, accepted: null })));
  });

  const handleAccept = (conflictId: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.conflictId === conflictId ? { ...d, accepted: true } : d
      )
    );
    onAcceptSuggestion(conflictId);
  };

  const handleReject = (conflictId: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.conflictId === conflictId ? { ...d, accepted: false } : d
      )
    );
    onRejectSuggestion(conflictId);
  };

  const handleAcceptAll = () => {
    setDecisions((prev) =>
      prev.map((d) => ({ ...d, accepted: true }))
    );
    onAcceptAll();
  };

  const handleRejectAll = () => {
    setDecisions((prev) =>
      prev.map((d) => ({ ...d, accepted: false }))
    );
    onRejectAll();
  };

  const handleSaveWithWarnings = () => {
    const unresolvedConflicts = conflicts.filter((c) => {
      const decision = decisions.find((d) => d.conflictId === c.id);
      return decision?.accepted === false || decision?.accepted === null;
    });
    onSaveWithWarnings(unresolvedConflicts);
  };

  const getDecision = (conflictId: string) => {
    return decisions.find((d) => d.conflictId === conflictId)?.accepted;
  };

  const allDecided = decisions.every((d) => d.accepted !== null);
  const hasRejected = decisions.some((d) => d.accepted === false);
  const errorCount = conflicts.filter((c) => c.severity === 'error').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Validation Results
          </DialogTitle>
          <DialogDescription>
            We found some issues with your itinerary. Review the suggestions below.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-3 py-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} warning{warningCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Conflicts List */}
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {conflicts.map((conflict) => {
              const decision = getDecision(conflict.id);
              return (
                <div
                  key={conflict.id}
                  className={cn(
                    'border rounded-lg p-4 transition-colors',
                    decision === true && 'bg-green-50 border-green-200',
                    decision === false && 'bg-red-50 border-red-200'
                  )}
                >
                  {/* Conflict Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {conflict.severity === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{conflict.message}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Day {conflict.dayNumber}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion */}
                  {conflict.suggestion && (
                    <div className="mt-3 pl-7">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Suggestion:</span>{' '}
                        {conflict.suggestion.description}
                      </p>

                      {/* Decision Buttons */}
                      {decision === null ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleAccept(conflict.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleReject(conflict.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant={decision ? 'default' : 'destructive'}
                          className={cn(
                            'text-xs',
                            decision && 'bg-green-600'
                          )}
                        >
                          {decision ? 'Accepted' : 'Rejected'}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 mr-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcceptAll}
              className="text-green-600"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Accept All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRejectAll}
              className="text-red-600"
            >
              <XSquare className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>

          {/* Main Actions */}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {hasRejected ? (
            <Button onClick={handleSaveWithWarnings}>
              Save with Warnings
            </Button>
          ) : (
            <Button onClick={handleSaveWithWarnings} disabled={!allDecided}>
              {allDecided ? 'Save Changes' : 'Make all decisions'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import Link from 'next/link';
import { TripData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import {
  MapPin,
  Calendar,
  Users,
  Check,
  Undo2,
  PanelRightOpen,
  PanelRightClose,
  Loader2,
  Sparkles,
  Compass,
} from 'lucide-react';

interface ItineraryHeaderProps {
  tripData: TripData;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  isSidebarOpen: boolean;
  isValidating?: boolean;
  onApplyChanges: () => void;
  onOptimize?: () => void;
  onUndo: () => void;
  onToggleSidebar: () => void;
}

export function ItineraryHeader({
  tripData,
  hasUnsavedChanges,
  canUndo,
  isSidebarOpen,
  isValidating = false,
  onApplyChanges,
  onOptimize,
  onUndo,
  onToggleSidebar,
}: ItineraryHeaderProps) {
  const startDate = tripData.startDate ? format(parseISO(tripData.startDate), 'MMM d') : '';
  const endDate = tripData.endDate ? format(parseISO(tripData.endDate), 'MMM d, yyyy') : '';

  return (
    <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Trip Info */}
          <div className="flex items-center gap-6">
            {/* Trippi Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <Compass className="h-5 w-5 text-blue-600 group-hover:rotate-45 transition-transform" />
              <span className="font-bold text-lg text-gray-900">Trippi</span>
            </Link>

            <div className="border-l pl-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                {tripData.destination}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {startDate} - {endDate}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {tripData.travelers}
                </span>
              </div>
            </div>

            </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                Unsaved changes
              </Badge>
            )}

            {/* Undo Button */}
            {canUndo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                className="flex items-center gap-2"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
            )}

            {/* Optimize Button */}
            {onOptimize && !hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={onOptimize}
                disabled={isValidating}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Optimize
              </Button>
            )}

            {/* Apply Changes Button */}
            <Button
              onClick={onApplyChanges}
              disabled={!hasUnsavedChanges || isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Apply Changes
                </>
              )}
            </Button>

            {/* Toggle Sidebar Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

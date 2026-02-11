'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Loader2 } from 'lucide-react';
import { VersionItem } from './VersionItem';
import type { VersionGroup, ItineraryVersion } from '@/types/version';

interface VersionHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedVersions: VersionGroup[];
  currentVersion: number;
  isLoading: boolean;
  onViewVersion: (version: ItineraryVersion) => void;
}

export function VersionHistoryDrawer({
  open,
  onOpenChange,
  groupedVersions,
  currentVersion,
  isLoading,
  onViewVersion,
}: VersionHistoryDrawerProps) {
  const totalVersions = groupedVersions.reduce(
    (acc, group) => acc + group.versions.length,
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Version History
          </SheetTitle>
          <SheetDescription>
            {totalVersions} version{totalVersions !== 1 ? 's' : ''} saved
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : groupedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <History className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No versions yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Apply changes to create your first version
              </p>
            </div>
          ) : (
            <div className="py-4">
              {groupedVersions.map((group) => (
                <div key={group.date} className="mb-6">
                  {/* Date header */}
                  <div className="flex items-center gap-2 px-6 mb-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Versions list */}
                  <div className="px-2">
                    {group.versions.map((version) => (
                      <VersionItem
                        key={version.id}
                        version={version}
                        isCurrent={version.version_number === currentVersion}
                        onView={onViewVersion}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

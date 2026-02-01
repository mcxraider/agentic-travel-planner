'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil, AlertCircle } from 'lucide-react';
import { ClarificationData } from '@/types';

interface ClarificationSummaryProps {
  collectedData: ClarificationData;
  title?: string;
  onEdit?: () => void;
}

// Fields to exclude from display (internal/system fields)
const EXCLUDED_FIELDS = [
  'session_id',
  'created_at',
  'updated_at',
  '_conflicts_resolved',
];

// Group fields by category for better organization
const FIELD_CATEGORIES: Record<string, string[]> = {
  'Trip Details': [
    'destination',
    'destination_cities',
    'start_date',
    'end_date',
    'budget',
    'currency',
    'travel_party',
    'budget_scope',
  ],
  'Your Profile': [
    'user_name',
    'citizenship',
    'health_limitations',
    'work_obligations',
    'dietary_restrictions',
    'specific_interests',
  ],
  'Travel Style': [
    'pace_preference',
    'accommodation_type',
    'transport_preference',
  ],
  'Trip Planning': ['top_3_must_dos', 'deal_breakers', 'time_constraints'],
  'Special Needs': ['accessibility_needs', 'child_friendly', 'pet_friendly'],
  Preferences: [], // Catch-all for other fields
};

export function ClarificationSummary({
  collectedData,
  title = 'Your Trip Preferences',
  onEdit,
}: ClarificationSummaryProps) {
  // Extract warnings if present
  const warnings = collectedData._warnings as string[] | undefined;

  // Filter out null/undefined/empty values and excluded fields
  const validEntries = Object.entries(collectedData).filter(
    ([key, value]) =>
      !EXCLUDED_FIELDS.includes(key) &&
      !key.startsWith('_') &&
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0) &&
      !(typeof value === 'object' && Object.keys(value).length === 0)
  );

  // Format a key for display
  const formatKey = (key: string): string => {
    // Special case for top_3_must_dos
    if (key === 'top_3_must_dos') return 'Top 3 Must-Dos';

    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format a ranked object ({"1": "...", "2": "...", "3": "..."})
  const formatRankedValue = (value: Record<string, string>): React.ReactNode => {
    const positions = Object.keys(value)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    return (
      <div className="space-y-1">
        {positions.map((pos) => (
          <div key={pos} className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-5 w-5 p-0 justify-center font-normal"
            >
              {pos}
            </Badge>
            <span className="text-sm">{value[String(pos)]}</span>
          </div>
        ))}
      </div>
    );
  };

  // Check if value is a ranked object
  const isRankedObject = (value: unknown): value is Record<string, string> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }
    const keys = Object.keys(value);
    return keys.some((k) => !isNaN(Number(k)));
  };

  // Format a value for display
  const formatValue = (key: string, value: unknown): React.ReactNode => {
    // Handle ranked objects
    if (isRankedObject(value)) {
      return formatRankedValue(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }
    if (typeof value === 'boolean') {
      return (
        <Badge variant="secondary" className="font-normal">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    if (typeof value === 'number') {
      return (
        <Badge variant="secondary" className="font-normal">
          {value.toLocaleString()}
        </Badge>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <Badge variant="secondary" className="font-normal">
          {JSON.stringify(value)}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-normal">
        {String(value)}
      </Badge>
    );
  };

  // Group entries by category
  const groupedEntries = Object.entries(FIELD_CATEGORIES).map(
    ([category, fields]) => {
      const categoryEntries = validEntries.filter(([key]) => {
        if (category === 'Preferences') {
          // Catch-all: include fields not in any other category
          return !Object.values(FIELD_CATEGORIES)
            .flat()
            .includes(key);
        }
        return fields.includes(key);
      });
      return { category, entries: categoryEntries };
    }
  );

  // Filter out empty categories
  const nonEmptyGroups = groupedEntries.filter(
    (group) => group.entries.length > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/50">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Planning Notes
                </p>
                <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {nonEmptyGroups.map((group, groupIndex) => (
          <div key={group.category}>
            {groupIndex > 0 && <Separator className="my-4" />}
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {group.category}
            </h4>
            <dl className="space-y-3">
              {group.entries.map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:gap-4">
                  <dt className="text-sm text-muted-foreground sm:w-1/3">
                    {formatKey(key)}
                  </dt>
                  <dd className="mt-1 sm:mt-0 sm:w-2/3">
                    {formatValue(key, value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        {validEntries.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No preferences collected yet.
          </p>
        )}

        {onEdit && (
          <>
            <Separator className="my-4" />
            <Button variant="outline" onClick={onEdit} className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Preferences
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

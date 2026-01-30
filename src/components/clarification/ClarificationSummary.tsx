'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ClarificationSummaryProps {
  collectedData: Record<string, unknown>;
  title?: string;
}

// Fields to exclude from display (internal/system fields)
const EXCLUDED_FIELDS = ['session_id', 'created_at', 'updated_at'];

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
  Preferences: [], // Catch-all for other fields
};

export function ClarificationSummary({
  collectedData,
  title = 'Your Trip Preferences',
}: ClarificationSummaryProps) {
  // Filter out null/undefined/empty values and excluded fields
  const validEntries = Object.entries(collectedData).filter(
    ([key, value]) =>
      !EXCLUDED_FIELDS.includes(key) &&
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
  );

  // Format a key for display
  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format a value for display
  const formatValue = (value: unknown): React.ReactNode => {
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }
    if (typeof value === 'boolean') {
      return <span>{value ? 'Yes' : 'No'}</span>;
    }
    if (typeof value === 'number') {
      return <span className="font-medium">{value.toLocaleString()}</span>;
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <span className="text-muted-foreground text-sm">
          {JSON.stringify(value)}
        </span>
      );
    }
    return <span className="font-medium">{String(value)}</span>;
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
                  <dd className="mt-1 sm:mt-0 sm:w-2/3">{formatValue(value)}</dd>
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
      </CardContent>
    </Card>
  );
}

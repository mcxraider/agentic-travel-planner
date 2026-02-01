# Frontend Modularity Improvement Plan

## Summary
Transform the travel planner frontend into a "plug and play" architecture where UI components can be easily swapped. This plan addresses prop drilling, store coupling, and monolithic components through incremental refactoring.

---

## Current Problems Identified

| Problem | Location | Impact | Status |
|---------|----------|--------|--------|
| Monolithic page component | `src/app/plan/page.tsx` (753 lines) | Hard to maintain, untestable | ⬜ Open |
| Monolithic itinerary page | `src/app/itinerary/[id]/page.tsx` (503 lines) | Same issues as plan page | ⬜ Open |
| Prop drilling | ~~TimelineView (14 props) → DayCard (12 props) → EventCard (13 props)~~ | ~~Components tightly coupled~~ | ✅ Fixed |
| Store coupling (5 stores) | itinerary/[id]/page.tsx destructures 25+ methods from single store | Can't swap components easily | ⬜ Open |
| Hardcoded configs | ~~EventCard type colors/icons (lines 56-78)~~ | ~~Not pluggable~~ | ✅ Fixed |
| No custom hooks | Business logic embedded in page components | Not reusable, hard to test | ⬜ Open |
| Duplicate types | ~~EditChatSidebar defines local ChatMessage (line 28) vs types/chat.ts~~ | ~~Inconsistent, maintenance burden~~ | ✅ Fixed |

---

## Implementation Status

> Last updated: 2026-02-01 (Phase 4 complete)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | Config files, type consolidation, API adapters |
| Phase 2: Hooks Extraction | ✅ Complete | Custom hooks for business logic |
| Phase 3: Context Architecture | ✅ Complete | ItineraryContext, prop drilling elimination |
| Phase 4: Compound Components | ✅ Complete | EventCard compound component pattern |

### Phase 1 Completed Items
- ✅ **Event Type Registry** (`/src/config/event-types.ts`) - Extracted hardcoded colors/icons from EventCard.tsx
- ✅ **ChatMessage Type Consolidation** - EditChatSidebar.tsx now imports from `@/types/chat`
- ✅ **API Adapter Base** (`/src/lib/api/adapters/base.ts`) - Generic ApiError class and fetchWithErrorHandling utility
  - Refactored `clarification.ts` to use the base adapter
  - ClarificationApiError now extends ApiError
- ✅ **EventConflictMap Type Consolidation** - Moved from `store/itinerary-store.ts` to `@/types/itinerary`
  - Updated TimelineView.tsx, DayCard.tsx to import from `@/types`
  - Re-exported from `@/store` for backward compatibility

### Phase 2 Completed Items
- ✅ **useEventAlternatives** (`/src/hooks/use-event-alternatives.ts`) - Extracted event grouping logic from DayCard.tsx
  - Groups events by alternativeGroupId
  - Identifies primary events and builds alternatives map
  - Used by DayCard.tsx
- ✅ **useItineraryEdit** (`/src/hooks/use-itinerary-edit.ts`) - Extracted event manipulation logic from itinerary/[id]/page.tsx
  - Handles event selection, deletion, movement, and addition
  - Manages alternatives, validation, conflict detection, optimization
  - Provides undo functionality
- ✅ **useDayPlanning** (`/src/hooks/use-day-planning.ts`) - Extracted day planning phase logic from plan/page.tsx
  - Request deduplication for day options fetching
  - Manages currentDay, totalDays, lockedDays, currentOptions
  - Handles option selection and itinerary building
- ✅ **usePlanningWizard** (`/src/hooks/use-planning-wizard.ts`) - Extracted wizard state machine from plan/page.tsx
  - Manages step transitions (input → clarification → planning → review)
  - Handles form submission and clarification
  - Exports step constants (STEP_INPUT, STEP_CLARIFICATION, STEP_PLANNING, STEP_REVIEW)

### Current Hooks
- `use-chat.ts` - Chat functionality (exists)
- `use-toast.ts` - Toast notifications (exists)
- `use-event-alternatives.ts` - Event grouping by alternativeGroupId (new)
- `use-itinerary-edit.ts` - Itinerary editing logic (new)
- `use-day-planning.ts` - Day planning phase with request deduplication (new)
- `use-planning-wizard.ts` - Multi-step wizard state machine (new)

### Phase 3 Completed Items
- ✅ **ItineraryContext** (`/src/contexts/itinerary-context.tsx`) - Created context provider and hooks
  - `ItineraryProvider` wraps component tree to provide state and actions
  - `useItinerary()` hook for required context access (throws if not in provider)
  - `useItineraryContext()` hook for optional context access (returns null if not in provider)
  - Provides: itinerary, selectedEventIds, eventConflicts, visualSelections, warnings, hasUnsavedChanges, canUndo
  - Actions: selectEvent, deleteEvent, moveEvent, openAddEvent, openAddAlternative, cycleAlternative, dismissConflict, dismissWarning, onDragStart
- ✅ **TimelineView refactored** - Now uses context with prop fallbacks
  - All 14 props are now optional when using ItineraryProvider
  - Maintains backward compatibility with prop-based usage
- ✅ **DayCard refactored** - Now uses context with prop fallbacks
  - Only `day` prop remains required (unique per card)
  - 11 other props are optional when using ItineraryProvider
- ✅ **EventCard refactored** - Now uses context with prop fallbacks
  - Only `event`, `dayNumber`, and `alternatives` props remain required
  - Other props derived from context when available
- ✅ **Itinerary page updated** - Uses ItineraryProvider and useItineraryEdit hook
  - Reduced from 503 lines to ~180 lines
  - TimelineView now rendered with no props inside ItineraryProvider

### Phase 4 Completed Items
- ✅ **EventCard Compound Component** (`/src/components/itinerary/EventCard/`) - Refactored monolithic EventCard to compound pattern
  - `EventCardContext.tsx` - Context provider sharing state and handlers to sub-components
  - `EventCardRoot.tsx` - Container with drag-drop support and stacked card rendering
  - `EventCardDragHandle.tsx` - Extracted drag handle with sortable listeners
  - `EventCardContent.tsx` - Content components (Time, Details, ConflictBadge, StackIndicator)
  - `EventCardActions.tsx` - Action buttons (CycleButton, AddAlternativeButton, DeleteButton, DismissConflict)
  - `index.tsx` - Exports both compound API and legacy wrapper for backward compatibility
- ✅ **Legacy API Preserved** - `EventCard` component still accepts all original props
- ✅ **Compound API Available** - New composable usage pattern:
  ```tsx
  <EventCard.Provider event={event} dayNumber={1}>
    <EventCard.Root>
      <EventCard.ConflictBadge />
      <EventCard.StackIndicator />
      <EventCard.DragHandle />
      <EventCard.Content />
      <EventCard.Actions />
    </EventCard.Root>
  </EventCard.Provider>
  ```

### Directories
- `/src/config/` - ✅ Created (contains event-types.ts, index.ts)
- `/src/lib/api/adapters/` - ✅ Created (contains base.ts, index.ts)
- `/src/contexts/` - ✅ Created (contains itinerary-context.tsx, index.ts)
- `/src/components/itinerary/EventCard/` - ✅ Created (compound component folder)

---

## Architecture Changes

### 1. Context-Based State (Eliminate Prop Drilling)

**Create `ItineraryContext`** to provide state/actions to the component tree:

```
Before: Page → TimelineView(14 props) → DayCard(12 props) → EventCard(13 props)
After:  ItineraryProvider wraps tree, components use useItinerary() hook
```

**Files to create:**
- `/src/contexts/itinerary-context.tsx`
- `/src/contexts/planning-context.tsx`

### 2. Custom Hooks (Extract Business Logic)

| Hook | Extracts From | Purpose |
|------|---------------|---------|
| `usePlanningWizard` | plan/page.tsx | Multi-step wizard state machine |
| `useItineraryEdit` | itinerary/[id]/page.tsx | Event manipulation + validation |
| `useDayPlanning` | plan/page.tsx | Day options fetching with deduplication |
| `useEventAlternatives` | DayCard.tsx | Alternative grouping logic |

**Files to create:**
- `/src/hooks/use-planning-wizard.ts`
- `/src/hooks/use-itinerary-edit.ts`
- `/src/hooks/use-day-planning.ts`
- `/src/hooks/use-event-alternatives.ts`

### 3. Configuration Registry (Plug and Play)

**Event Type Registry** - Make icons/colors swappable:

```typescript
// /src/config/event-types.ts
export const EVENT_TYPE_REGISTRY: Record<string, EventTypeConfig> = {
  activity: { icon: Activity, colorClass: 'bg-emerald-50 border-emerald-300', ... },
  dining: { icon: Utensils, colorClass: 'bg-amber-50 border-amber-300', ... },
  // Add new types without modifying components
};

export function registerEventType(type: string, config: EventTypeConfig) {
  EVENT_TYPE_REGISTRY[type] = config;
}
```

**Files to create:**
- `/src/config/event-types.ts`
- `/src/config/clarification-fields.ts`
- `/src/config/wizard-steps.ts`

### 4. API Adapter Layer

Separate API calls from components and consolidate error handling:

**Existing code to refactor:**
- `/src/lib/api/clarification.ts` already has `ClarificationApiError` class
- Error handling pattern is repeated in `startClarificationSession`, `submitClarificationResponses`, etc.

**Proposed changes:**
1. Extract common `ApiError` class and `fetchWithErrorHandling` to `/src/lib/api/adapters/base.ts`
2. Refactor `clarification.ts` to use the shared base
3. Add new adapters for itinerary and chat

```typescript
// /src/lib/api/adapters/itinerary-adapter.ts
export const itineraryAdapter = {
  validate: (itinerary) => fetchWithErrorHandling('/api/validate'),
  optimize: (itinerary) => fetchWithErrorHandling('/api/optimize'),
};
```

**Files to create:**
- `/src/lib/api/adapters/base.ts` - Generic `ApiError` + `fetchWithErrorHandling`
- `/src/lib/api/adapters/chat-adapter.ts`
- `/src/lib/api/adapters/itinerary-adapter.ts`

**Files to refactor:**
- `/src/lib/api/clarification.ts` - Use base adapter, remove duplicate error class

### 5. Compound Components (EventCard Refactor)

Split EventCard (13 props) into composable parts:

```tsx
// New API
<EventCard.Root event={event}>
  <EventCard.DragHandle />
  <EventCard.Content />
  <EventCard.Actions />
</EventCard.Root>

// Legacy API still works
<EventCard {...legacyProps} />
```

**Files to create:**
- `/src/components/itinerary/EventCard/index.tsx`
- `/src/components/itinerary/EventCard/EventCardContext.tsx`
- `/src/components/itinerary/EventCard/EventCardRoot.tsx`
- `/src/components/itinerary/EventCard/EventCardContent.tsx`
- `/src/components/itinerary/EventCard/EventCardActions.tsx`

---

## Implementation Phases

### Phase 1: Foundation (Low Risk) ✅ COMPLETE
1. ✅ **DONE** Create `/src/lib/api/adapters/base.ts` - Error handling wrapper
   - Created generic `ApiError` class with helper methods (isStatus, isClientError, isServerError)
   - Created `fetchWithErrorHandling<T>()` utility for standardized fetch with error handling
   - Created `createFetchAdapter()` factory for domain-specific adapters
   - Refactored `clarification.ts` to use new adapter, reducing code duplication
2. ✅ **DONE** Create `/src/config/event-types.ts` - Extract hardcoded colors/icons from `EventCard.tsx:56-78`
   - Created registry with `getEventTypeConfig()`, `registerEventType()` for plug-and-play extensibility
   - EventCard.tsx now imports from `@/config` instead of hardcoded maps
3. ✅ **DONE** Move `EventConflictMap` type from `store/itinerary-store.ts:5` to `/src/types/itinerary.ts`
   - Added type definition with JSDoc to `@/types/itinerary`
   - Updated TimelineView.tsx, DayCard.tsx to import from `@/types`
   - Maintained backward compatibility via re-export from `@/store`
4. ✅ **DONE** Remove duplicate `ChatMessage` from `EditChatSidebar.tsx:28-32` - import from `@/types/chat` instead
   - Note: `types/chat.ts` version is a superset (has `timestamp`, `type`, `options`, `metadata`)
   - EditChatSidebar now imports from `@/types` and includes required `timestamp` field

### Phase 2: Hooks Extraction (High Impact) ✅ COMPLETE
5. ✅ **DONE** Create `useItineraryEdit` hook from itinerary page logic
   - Extracted event handlers, validation, conflict management, optimization
   - Ready for use in itinerary/[id]/page.tsx refactor
6. ✅ **DONE** Create `usePlanningWizard` hook from plan page (state machine)
   - Extracted step management, form submission, clarification handling
   - Exports step constants for type-safe step management
7. ✅ **DONE** Create `useDayPlanning` hook (request deduplication)
   - Extracted day options fetching with refs for deduplication
   - Manages planning phase state
8. ✅ **DONE** Create `useEventAlternatives` hook (grouping logic)
   - Extracted from DayCard.tsx useMemo block
   - DayCard.tsx now uses this hook

### Phase 3: Context Architecture (Eliminate Prop Drilling) ✅ COMPLETE
9. ✅ **DONE** Create `ItineraryContext` with provider and hook
   - Created ItineraryProvider and useItinerary/useItineraryContext hooks
   - Provides state and actions to component tree
10. ✅ **DONE** Refactor TimelineView to use context (remove 14 props)
    - All props now optional with context fallbacks
11. ✅ **DONE** Refactor DayCard to use context (remove 12 props)
    - Only `day` prop required, others from context
12. ✅ **DONE** Refactor EventCard to use context (remove 13 props)
    - Only `event`, `dayNumber`, `alternatives` required, others from context

### Phase 4: Compound Components ✅ COMPLETE
13. ✅ **DONE** Refactor EventCard to compound component pattern
    - Created EventCardContext, EventCardRoot, EventCardDragHandle, EventCardContent, EventCardActions
    - Sub-components: Time, Details, ConflictBadge, StackIndicator, CycleButton, AddAlternativeButton, DeleteButton, DismissConflict
14. ✅ **DONE** Add legacy wrapper for backward compatibility
    - `EventCard` function wraps compound components, accepts all original props
15. ⬜ Create configuration-driven ClarificationSummary (future enhancement)

---

## Critical Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `src/app/plan/page.tsx` | Extract to usePlanningWizard hook, reduce from 753 to ~200 lines | ⬜ Pending |
| `src/app/itinerary/[id]/page.tsx` | ~~Wrap with ItineraryProvider, use useItineraryEdit~~ | ✅ Done |
| `src/components/itinerary/TimelineView.tsx` | ~~Remove 14 props, use useItinerary()~~; ~~update EventConflictMap import~~ | ✅ Done |
| `src/components/itinerary/DayCard.tsx` | ~~Remove 12 props, use useItinerary()~~; ~~update EventConflictMap import~~; ~~extract grouping logic~~ | ✅ Done |
| `src/components/itinerary/EventCard/` | ~~Remove 13 props~~, ~~convert to compound component (Phase 4)~~, ~~extract colors~~ | ✅ Done |
| `src/components/itinerary/EditChatSidebar.tsx` | ~~Import ChatMessage from types (remove duplicate)~~ | ✅ Done |
| `src/store/itinerary-store.ts` | ~~Import EventConflictMap from types instead of defining locally~~ | ✅ Done |
| `src/lib/api/clarification.ts` | ~~Refactor to use base adapter, consolidate error handling~~ | ✅ Done |

---

## New File Structure

```
src/
├── config/                      # ✅ CREATED
│   ├── index.ts                 # ✅ CREATED - Barrel exports
│   ├── event-types.ts           # ✅ CREATED - Pluggable event icons/colors
│   ├── clarification-fields.ts # Field category config (future)
│   └── wizard-steps.ts         # Step definitions (future)
├── contexts/                    # ✅ CREATED
│   ├── index.ts                 # ✅ CREATED - Barrel exports
│   ├── itinerary-context.tsx    # ✅ CREATED - Itinerary state + actions
│   └── planning-context.tsx     # Future - Planning wizard state
├── hooks/
│   ├── index.ts                 # ✅ UPDATED - Exports all hooks
│   ├── use-chat.ts              # Existing
│   ├── use-toast.ts             # Existing
│   ├── use-planning-wizard.ts   # ✅ CREATED - Wizard state machine
│   ├── use-itinerary-edit.ts    # ✅ CREATED - Event manipulation
│   ├── use-day-planning.ts      # ✅ CREATED - Day options with deduplication
│   └── use-event-alternatives.ts # ✅ CREATED - Event grouping
├── lib/api/adapters/            # ✅ CREATED
│   ├── index.ts                 # ✅ CREATED - Barrel exports
│   ├── base.ts                  # ✅ CREATED - ApiError, fetchWithErrorHandling, createFetchAdapter
│   ├── chat-adapter.ts         # Future - chat API calls
│   └── itinerary-adapter.ts    # Future - itinerary validation/optimization
├── types/
│   └── itinerary.ts            # ✅ UPDATED - Added EventConflictMap
└── components/itinerary/
    └── EventCard/              # ✅ CREATED - Compound component folder
        ├── index.tsx           # ✅ CREATED - Compound + legacy exports
        ├── EventCardContext.tsx # ✅ CREATED - Shared context for sub-components
        ├── EventCardRoot.tsx   # ✅ CREATED - Container with drag-drop
        ├── EventCardDragHandle.tsx # ✅ CREATED - Drag handle component
        ├── EventCardContent.tsx # ✅ CREATED - Time, Details, badges
        └── EventCardActions.tsx # ✅ CREATED - Action buttons
```

---

## Verification Steps

After implementation, verify:

1. **Run dev server**: `npm run dev`
2. **Type check**: `npx tsc --noEmit`
3. **Lint**: `npm run lint`
4. **Test flows**:
   - Complete planning wizard (input → clarification → planning → review)
   - Navigate to itinerary view
   - Drag-drop events between days
   - Add/delete events
   - Cycle through alternatives
   - Apply changes with conflict detection

---

## Backward Compatibility

All changes maintain backward compatibility through:
- Dual exports (compound + legacy API)
- Optional context with prop fallbacks
- Incremental refactoring (one component at a time)

---

## Detailed Code Examples

### ItineraryContext Implementation

```typescript
// /src/contexts/itinerary-context.tsx
'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useItineraryStore } from '@/store';
import { Event, Itinerary } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ItineraryContextValue {
  // State
  itinerary: Itinerary | null;
  selectedEventIds: string[];
  eventConflicts: Record<string, string>;
  visualSelections: Record<string, string>;
  hasUnsavedChanges: boolean;
  canUndo: boolean;

  // Actions
  selectEvent: (eventId: string, multiSelect: boolean) => void;
  deleteEvent: (dayNumber: number, eventId: string) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number, newIndex?: number) => void;
  addEvent: (dayNumber: number, event: Event) => void;
  addAlternative: (dayNumber: number, primaryEventId: string, alternative: Event) => void;
  cycleAlternative: (groupId: string, eventId: string) => void;
  dismissConflict: (eventId: string) => void;
  undo: () => void;
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const store = useItineraryStore();
  const { toast } = useToast();

  const deleteEvent = useCallback(
    (dayNumber: number, eventId: string) => {
      store.pushUndo();
      store.deleteEvent(dayNumber, eventId);
      toast({ title: 'Event deleted' });
    },
    [store, toast]
  );

  const value: ItineraryContextValue = {
    itinerary: store.itinerary,
    selectedEventIds: store.selectedEventIds,
    eventConflicts: store.eventConflicts,
    visualSelections: store.visualSelections,
    hasUnsavedChanges: store.hasUnsavedChanges,
    canUndo: store.undoStack.length > 0,
    selectEvent: store.toggleEventSelection,
    deleteEvent,
    moveEvent: store.moveEvent,
    addEvent: store.addEvent,
    addAlternative: store.addAlternative,
    cycleAlternative: store.setVisualSelection,
    dismissConflict: store.dismissEventConflict,
    undo: store.undo,
  };

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItinerary() {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within ItineraryProvider');
  }
  return context;
}
```

### usePlanningWizard Hook

```typescript
// /src/hooks/use-planning-wizard.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { useTripStore, useChatStore, useItineraryStore, useClarificationStore } from '@/store';
import { Day, Option, ChatMessage } from '@/types';

export type WizardStep = 'input' | 'clarification' | 'planning' | 'review';

export function usePlanningWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(5);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);

  // Store hooks
  const tripStore = useTripStore();
  const chatStore = useChatStore();
  const itineraryStore = useItineraryStore();
  const clarificationStore = useClarificationStore();

  // Refs for request deduplication
  const dayOptionsRequestedRef = useRef<number>(0);

  const handleFormSubmit = useCallback(async (formData) => {
    // Extracted from plan/page.tsx
    setIsSubmitting(true);
    // ... form submission logic
    setCurrentStep('clarification');
    setIsSubmitting(false);
  }, []);

  const handleOptionSelect = useCallback(async (option: Option) => {
    // Extracted from plan/page.tsx
    // ... option selection logic
    if (currentDay >= totalDays) {
      setCurrentStep('review');
    } else {
      setCurrentDay(prev => prev + 1);
    }
  }, [currentDay, totalDays]);

  return {
    // State
    currentStep,
    isSubmitting,
    currentDay,
    totalDays,
    lockedDays,
    currentOptions,

    // Derived state from stores
    tripData: tripStore.tripData,
    messages: chatStore.messages,
    isTyping: chatStore.isTyping,
    clarificationStatus: clarificationStore.status,
    questions: clarificationStore.questions,
    answers: clarificationStore.answers,

    // Actions
    handleFormSubmit,
    handleOptionSelect,
    setTotalDays,
    setAnswer: clarificationStore.setAnswer,
  };
}
```

### Event Type Registry

```typescript
// /src/config/event-types.ts
import { Briefcase, Activity, Utensils, Car, Bed } from 'lucide-react';
import { ComponentType } from 'react';

export interface EventTypeConfig {
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
  colorClassLight: string;
  label: string;
}

export const EVENT_TYPE_REGISTRY: Record<string, EventTypeConfig> = {
  logistics: {
    icon: Briefcase,
    colorClass: 'bg-slate-100 border-slate-300 text-slate-700',
    colorClassLight: 'bg-slate-50 border-slate-200',
    label: 'Logistics',
  },
  activity: {
    icon: Activity,
    colorClass: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    colorClassLight: 'bg-emerald-50/50 border-emerald-200',
    label: 'Activity',
  },
  dining: {
    icon: Utensils,
    colorClass: 'bg-amber-50 border-amber-300 text-amber-700',
    colorClassLight: 'bg-amber-50/50 border-amber-200',
    label: 'Dining',
  },
  transit: {
    icon: Car,
    colorClass: 'bg-blue-50 border-blue-300 text-blue-700',
    colorClassLight: 'bg-blue-50/50 border-blue-200',
    label: 'Transit',
  },
  rest: {
    icon: Bed,
    colorClass: 'bg-purple-50 border-purple-300 text-purple-700',
    colorClassLight: 'bg-purple-50/50 border-purple-200',
    label: 'Rest',
  },
};

// Allow runtime extension for plug-and-play
export function registerEventType(type: string, config: EventTypeConfig) {
  EVENT_TYPE_REGISTRY[type] = config;
}

export function getEventTypeConfig(type: string): EventTypeConfig {
  return EVENT_TYPE_REGISTRY[type] || EVENT_TYPE_REGISTRY.activity;
}
```

### API Adapter Base

```typescript
// /src/lib/api/adapters/base.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        errorBody.detail || response.statusText,
        response.status,
        errorBody
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error. Please check your connection.');
  }
}
```

---

## Priority Summary

1. **Quick Wins (Phase 1)**: Event type registry, type consolidation, API adapters
2. **High Impact (Phase 2)**: Custom hooks extraction - reduces page complexity significantly
3. **Architecture (Phase 3-4)**: Context + compound components - enables true plug-and-play

The plan is designed for incremental adoption - each phase delivers value independently and maintains backward compatibility throughout.

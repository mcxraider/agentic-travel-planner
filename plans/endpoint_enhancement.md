# Plan: Split `/plan` into `/plan`, `/research`, `/select`

## Context

The current `/plan` page is a monolithic 750-line component handling all 4 wizard steps (Input, Clarification, Research loading, Day Planning, Review). The goal is to split this into 3 independent pages so each endpoint can be tested independently:

- **`/plan`** — Input + Clarification only (steps 1-2)
- **`/research`** — Loading animation with mock JSON input (new step 3)
- **`/select`** — Day-by-day selection + Review (steps 4-5)

Each page must work standalone with mock data fallbacks.

---

## Files to Create

### 1. `src/lib/mock-data/mock-research-input.ts`
Export the user-provided mock JSON (the exact structure with `user_profile`, `trip_details`, `preferences`, `schedule`). Also export a `ResearchInput` TypeScript interface matching this shape.

```ts
export const MOCK_RESEARCH_INPUT = {
  user_profile: { name: "Jerry", citizenship: "Singaporean", ... },
  trip_details: { destination: "Bali", travel_dates: { start: "2026-02-12", end: "2026-02-14", duration_days: 3 }, ... },
  preferences: { activity_preferences: [...], pace_preference: "Relaxed", ... },
  schedule: { arrival_time: "Early AM (<9am)", departure_time: "Afternoon (12-5pm)" }
};
```

### 2. `src/app/research/page.tsx` (~80 lines)
- Loads `MOCK_RESEARCH_INPUT` on mount (no dependency on `/plan` state)
- Shows `ProgressBar` at step 3
- Displays loading animation with cycling stages ("Analyzing preferences...", "Searching activities...", "Finding locations...", "Building itinerary...")
- Shows destination/dates context from mock JSON
- After ~5 seconds, calls `setPhase('research')` and `router.push('/select')`

### 3. `src/app/select/page.tsx` (~250 lines)
Extract day planning + review from current `/plan` page:
- On mount: check `useTripStore` for `tripData`; if absent, build mock `TripData` from `MOCK_RESEARCH_INPUT` (standalone mode)
- `ProgressBar` at step 4 (Planning) or step 5 (Review)
- Day planning: `sendChatRequest`, `useEffect` for day options, `handleOptionSelect`, `ChatWindow` + `ItineraryPreview` (extracted verbatim from `/plan` lines 359-469, 647-678)
- Review: trip summary card + "View Full Itinerary" button → `/itinerary/[id]` (extracted from `/plan` lines 682-746)
- Step constants: `STEP_PLANNING = 4`, `STEP_REVIEW = 5`

---

## Files to Modify

### 4. `src/types/trip.ts` (line 28)
Add `'research'` to `PlanningPhase`:
```ts
export type PlanningPhase = 'input' | 'clarification' | 'research' | 'planning' | 'review' | 'editing';
```

### 5. `src/lib/constants.ts` (lines 5-10)
Add research phase to `PLANNING_PHASES`:
```ts
{ id: 'research', label: 'Research' },  // between clarification and planning
```

### 6. `src/components/planning/ProgressBar.tsx` (lines 6-11)
Update `steps` array from 4 to 5:
```ts
{ id: 1, name: 'Trip Details', key: 'input' },
{ id: 2, name: 'Preferences', key: 'clarification' },
{ id: 3, name: 'Research', key: 'research' },      // NEW
{ id: 4, name: 'Day Planning', key: 'planning' },   // was id: 3
{ id: 5, name: 'Review', key: 'review' },            // was id: 4
```

### 7. `src/app/plan/page.tsx` — trim to steps 1-2 only

**Remove:**
- State: `isResearching`, `currentDay`, `lockedDays`, `currentOptions`, `dayOptionsRequestedRef`, `dayRequestInFlight`
- Store imports: `useChatStore`, `useItineraryStore`
- Component imports: `ChatWindow`, `ItineraryPreview`
- Functions: `sendChatRequest`, `handleOptionSelect`, `handlePlanningMessage`, `handleViewItinerary`
- The `useEffect` for requesting day options (lines 359-406)
- JSX for `STEP_PLANNING` (lines 647-678) and `STEP_REVIEW` (lines 681-746)
- The `isResearching` ternary UI block (lines 589-600)
- Step constants `STEP_PLANNING = 3`, `STEP_REVIEW = 4`

**Change:**
- Replace `handleProceedToPlanning` with:
  ```ts
  const handleProceedToResearch = () => {
    setPhase('research');
    router.push('/research');
  };
  ```
- ClarificationSummary button: "Continue to Planning" → "Continue", calls `handleProceedToResearch`

### 8. `src/lib/mock-data/index.ts`
Add export: `export * from './mock-research-input';`

### 9. `src/hooks/use-planning-wizard.ts` (optional cleanup)
The hook mirrors `/plan` logic but is NOT currently imported by the page. Update `handleProceedToPlanning` to navigate to `/research` and remove `isResearching` for consistency. Low priority since unused.

### 10. `codebase_guide.md`
- Update overview to 5-step flow
- Add `/research` and `/select` page route docs
- Update state machine diagram
- Add `mock-research-input.ts` to file reference

---

## Implementation Order

1. `src/types/trip.ts` — add `'research'`
2. `src/lib/constants.ts` — add research phase
3. `src/components/planning/ProgressBar.tsx` — 5 steps
4. `src/lib/mock-data/mock-research-input.ts` — create mock JSON
5. `src/lib/mock-data/index.ts` — add export
6. `src/app/research/page.tsx` — create research page
7. `src/app/select/page.tsx` — create select page
8. `src/app/plan/page.tsx` — trim to steps 1-2
9. `src/hooks/use-planning-wizard.ts` — optional cleanup
10. `codebase_guide.md` — update docs

Steps 1-5 have no cross-dependencies. Steps 6-8 can be done after 1-5.

---

## Verification

1. **`/research` standalone**: Navigate to `localhost:3000/research` directly — should show loading animation with "Bali" context, auto-redirect to `/select` after ~5s
2. **`/select` standalone**: Navigate to `localhost:3000/select` directly — should load mock Bali trip data, show day planning with ChatWindow, allow selecting options for 3 days, then show review
3. **`/plan` trimmed**: Navigate to `localhost:3000/plan` — should show Input form and Clarification only. After clarification completes, "Continue" button navigates to `/research`
4. **Full flow**: `/plan` → `/research` → `/select` → `/itinerary/[id]` works end-to-end (requires backend for clarification, or mock fallback)
5. **Build check**: `npm run build` passes with no TypeScript errors
6. **Progress bar**: ProgressBar shows 5 steps correctly on all 3 pages with appropriate step highlighted

# Plan: 4 Frontend Enhancements

## Context

Four changes to the travel planner frontend: replacing the traveller dropdown with numeric pickers, adding an event edit feature via a "..." menu, fixing the completeness score that's stuck at zero, and adding health-gated POST requests with adaptive polling.

---

## Task 1: Traveller Numeric Pickers (Adults / Children / Elderly)

**Problem:** The current Travel Party dropdown uses categorical strings ("1 adult", "couple", etc.) and `TripData.travelers` is hardcoded to `1`.

### Changes

**1a. Create `src/components/form/NumericStepper.tsx` (NEW)**
- Reusable stepper with label, `-` button, number display, `+` button
- Props: `label`, `value`, `min`, `max`, `onChange`, `disabled`
- Use existing `Button` from `@/components/ui/button` with `variant="outline"`, `size="icon"`
- Use `Minus` and `Plus` icons from lucide-react
- Export from `src/components/form/index.ts`

**1b. Modify `src/components/planning/InitialInputForm.tsx`**
- Replace `travel_party: string` in `TripInputFormData` with `adults: number`, `children: number`, `elderly: number`
- Update initial state: `adults: 1, children: 0, elderly: 0`
- Replace the `<Select>` block (lines 201-222) with three `NumericStepper` components in a `grid grid-cols-3 gap-4`
- Adults: min 1, max 20; Children: min 0, max 20; Elderly: min 0, max 20
- Remove `TRAVEL_PARTY_OPTIONS` import
- Add `isServerOffline` prop (for Task 4, but add now to avoid double-editing): disable submit button when offline, change text to "Server Offline"

**1c. Add helper `buildTravelPartyString` in `src/lib/utils.ts`**
- Builds string like "2 adults, 1 child, 1 elderly" from the three numbers
- Handle pluralization: "child" vs "children", "adult" vs "adults"

**1d. Modify `src/app/plan/page.tsx`**
- Line 100: `travel_party: buildTravelPartyString(formData.adults, formData.children, formData.elderly)`
- Line 138: `travelers: formData.adults + formData.children + formData.elderly`

**1e. Clean up `src/lib/constants.ts`**
- Remove `TRAVEL_PARTY_OPTIONS` (lines 76-83)

---

## Task 2: "..." More Actions Menu + Edit Event

**Problem:** No way to edit existing events. The "+" button only adds alternatives.

### Changes

**2a. Add `editEvent` to `src/store/itinerary-store.ts`**
- New method: `editEvent: (dayNumber: number, eventId: string, updatedFields: Partial<Event>) => void`
- Implementation: map over days, find matching day, map over events, spread `updatedFields` onto matching event, set `hasUnsavedChanges: true`

**2b. Add edit handlers to `src/hooks/use-itinerary-edit.ts`**
- New state: `editEventData: { dayNumber: number; event: Event } | null`
- New handlers: `handleOpenEditEvent`, `handleCloseEditEvent`, `handleEditEvent`
- `handleEditEvent` calls `pushUndo()` then `editEvent()` from store, shows toast
- Return all three + `editEventData` from the hook

**2c. Add `onEditEvent` to `src/components/itinerary/EventCard/EventCardContext.tsx`**
- Add `onEditEvent?: (dayNumber: number, event: Event) => void` to `EventCardContextValue` (line 46)
- Add to `EventCardProviderProps` (line 63)
- Resolve: `const onEditEvent = itineraryContext?.openEditEvent ?? propOnEditEvent` (after line 110)
- Add to `contextValue` and dependency array

**2d. Add `openEditEvent` to `src/contexts/itinerary-context.tsx`**
- Add `openEditEvent: (dayNumber: number, event: Event) => void` to `ItineraryContextValue` (line 27)

**2e. Replace `EventCardAddAlternativeButton` in `src/components/itinerary/EventCard/EventCardActions.tsx`**
- Create new `EventCardMoreActionsButton` component
- Uses `MoreHorizontal` icon (lucide-react) + existing `Popover`/`PopoverContent`/`PopoverTrigger`
- Popover menu shows two options:
  - `Plus` icon + "Add Alternative" (calls existing `onAddAlternative`)
  - `Pencil` icon + "Edit Event" (calls new `onEditEvent`)
- Each option: only rendered if its handler is available
- In `EventCardActions` composite (line 265): replace `EventCardAddAlternativeButton` with `EventCardMoreActionsButton`

**2f. Update `src/components/itinerary/EventCard/index.tsx`**
- Export `MoreActionsButton: EventCardMoreActionsButton` in the compound component
- Keep `AddAlternativeButton` pointing to the new component for backward compat

**2g. Create `src/components/itinerary/EditEventForm.tsx` (NEW)**
- Modal dialog similar to `AddEventForm.tsx` but:
  - Title: "Edit Event"
  - Form pre-populated from `event` prop via `useEffect` on `event` change
  - Fields: title, type, start time, end time, location, cost, description (matching AddEventForm)
  - Submit calls `onEditEvent(dayNumber, event.id, updatedFields)` with only changed fields
  - Button text: "Save Changes"
- Export from `src/components/itinerary/index.ts`

**2h. Wire up in `src/app/itinerary/[id]/page.tsx`**
- Destructure `editEventData`, `handleOpenEditEvent`, `handleCloseEditEvent`, `handleEditEvent` from `useItineraryEdit()`
- Add `openEditEvent: handleOpenEditEvent` to the `contextValue` object
- Mount `<EditEventForm>` modal alongside `<AddAlternativeForm>`

---

## Task 3: Fix Completeness Score Stuck at Zero

**Problem:** `questionsState.score` from backend is always 0 until completion. The `CompletenessProgress` component displays it as-is.

### Changes

**3a. Add `getComputedScore` to `src/store/clarification-store.ts`**
- New method using `get()` to read current state
- Logic:
  ```
  if status === 'complete' → return 100
  if status === 'idle' → return 0

  collected = questionsState.collected.length
  missingTier1 = questionsState.missing_tier1.length
  missingTier2 = questionsState.missing_tier2.length
  totalFields = collected + missingTier1 + missingTier2

  clientScore = (collected / totalFields) * 100   [if totalFields > 0]

  // Partial credit for current round in-progress answers
  currentAnswered = Object.keys(answers).length
  currentTotal = questions.length
  if currentTotal > 0 and totalFields > 0:
    partialCredit = (currentAnswered / currentTotal) * (currentTotal / totalFields) * 100
    clientScore += partialCredit

  return max(backendScore, min(clientScore, 99))  // cap at 99 until complete
  ```

**3b. Update `src/app/plan/page.tsx` line 334**
- Destructure `getComputedScore` from `useClarificationStore()`
- Replace: `<CompletenessProgress score={questionsState?.score ?? 0} />`
- With: `<CompletenessProgress score={getComputedScore()} />`

---

## Task 4: Adaptive Health Polling + Server-Gated Buttons

**Problem:** Health check polls every 30s regardless. POST buttons are enabled even when server is down.

### Changes

**4a. Modify `src/hooks/use-server-health.ts`**
- Add two constants: `HEALTHY_INTERVAL = 30000`, `UNHEALTHY_INTERVAL = 3000`
- Split the `useEffect` into two:
  1. Initial check on mount (runs once)
  2. Adaptive polling: `useEffect` with `state.status` in deps, sets interval to `UNHEALTHY_INTERVAL` when `status === 'unhealthy'`, `HEALTHY_INTERVAL` otherwise. Clears and recreates interval on status change.

**4b. Modify `src/app/plan/page.tsx`**
- Import `useServerHealth` from `@/hooks`
- Call `const { status: serverStatus } = useServerHealth()` in PlanPage
- Derive `const isServerHealthy = serverStatus === 'healthy'`
- Pass `isServerOffline={!isServerHealthy}` to `<InitialInputForm>` (line 310-313)
- Add server-offline warning banner above the InitialInputForm Card when `!isServerHealthy && currentStep === STEP_INPUT`:
  ```tsx
  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
    <span>Backend server is offline. Please start the server at localhost:8000.</span>
  </div>
  ```
- For clarification step "Continue" button (line 387): add `|| !isServerHealthy` to disabled condition, change text to show "Server Offline" when unhealthy
- Add same warning banner above the Continue button in clarification step when `!isServerHealthy`

**4c. Modify `src/components/planning/InitialInputForm.tsx`**
- Add `isServerOffline?: boolean` to `InitialInputFormProps`
- Submit button (line 251): `disabled={isLoading || isServerOffline}`
- Button text: `isLoading ? 'Starting...' : isServerOffline ? 'Server Offline' : 'Start Planning'`

---

## Implementation Order

1. **Task 3** - Smallest (2 files), fixes a visible bug
2. **Task 4** - 3 files, self-contained health logic
3. **Task 1** - 5 files, UI replacement + new component
4. **Task 2** - 8 files, largest scope (new feature)

Tasks 1 & 2 are fully independent. Tasks 3 & 4 both touch `plan/page.tsx` but in different sections (score display vs. button disabling).

---

## Verification

1. **Task 1:** On `/plan`, verify numeric steppers render with correct min/max, that the travel_party string is built correctly in the API request (check Network tab), and `travelers` field is the sum
2. **Task 2:** On `/itinerary/[id]`, hover over an event, click "...", verify both menu items appear, test "Edit Event" opens pre-populated form, save changes and verify event updates, test undo works
3. **Task 3:** On `/plan` step 2, verify score starts > 0 after first round, increases with each answered question, reaches 100 on completion
4. **Task 4:** Stop the backend server, verify polling switches to 3s (Network tab), submit buttons show "Server Offline" with warning banner, start server again and verify buttons re-enable within 3s
5. Run `npm run build` and `npx tsc --noEmit` to verify no type errors

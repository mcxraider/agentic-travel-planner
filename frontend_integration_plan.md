# Clarification Stage Implementation Plan

## Overview
Add a new clarification stage that integrates with a real backend API at `localhost:8000`. This replaces the current mock chat-based clarification with a structured question/answer UI.

---

## Files to Create

### 1. Types (`src/types/clarification.ts`)
New interfaces for the clarification API:
- `ClarificationQuestion` - question structure from backend
- `StartSessionRequest` - payload for `/api/clarification/start`
- `StartSessionResponse`, `RespondResponse` - API responses
- `ClarificationState` - store state shape

### 2. Clarification Store (`src/store/clarification-store.ts`)
Zustand store to track:
- `sessionId`, `currentRound`, `questions[]`, `answers{}`
- `completenessScore`, `collectedData`
- Actions: `startSession`, `addAnswer`, `setComplete`, `reset`

### 3. API Service (`src/lib/api/clarification.ts`)
Functions to call the real backend:
- `startClarificationSession(request)` → POST `/api/clarification/start`
- `submitClarificationResponses(sessionId, responses)` → POST `/api/clarification/respond`
- Custom `ClarificationApiError` class for error handling

### 4. Reusable Form Components (`src/components/form/`)
- `FormField.tsx` - wrapper with label, error display
- `DatePickerField.tsx` - calendar picker returning YYYY-MM-DD
- `MultiTextInput.tsx` - for destination_cities array (add/remove tags)
- `index.ts` - exports

### 5. Clarification Question Components (`src/components/clarification/`)
- `QuestionCard.tsx` - renders single question with radio/checkbox based on `multi_select`
- `CompletenessProgress.tsx` - progress bar showing `completeness_score`
- `ClarificationSummary.tsx` - displays `collected_data` before proceeding
- `ApiError.tsx` - error display with retry button
- `index.ts` - exports

### 6. User Profile Modal (`src/components/UserProfileModal.tsx`)
Dialog with fields: `user_name`, `citizenship`, `health_limitations`, `work_obligations`, `dietary_restrictions`, `specific_interests[]`

---

## Files to Modify

### 1. `src/types/trip.ts`
Update `UserProfile` interface:
```typescript
export interface UserProfile {
  user_name?: string;
  citizenship?: string;
  health_limitations?: string;
  work_obligations?: string;
  dietary_restrictions?: string;
  specific_interests?: string[];
}
```

### 2. `src/types/index.ts`
Add export: `export * from './clarification';`

### 3. `src/lib/constants.ts`
Add new constants:
- `CURRENCY_OPTIONS` - USD, EUR, GBP, JPY, etc.
- `TRAVEL_PARTY_OPTIONS` - 1 adult, 2 adults, family, group, etc.
- `BUDGET_SCOPE_OPTIONS` - Total trip, Per person, Daily
- `API_BASE_URL = 'http://localhost:8000'`

### 4. `src/store/trip-store.ts`
- Add `persist` middleware to save `userProfile` to localStorage
- Keep existing functionality

### 5. `src/store/index.ts`
Add export: `export { useClarificationStore } from './clarification-store';`

### 6. `src/components/Navbar.tsx`
- Add flexbox layout: logo left, profile button right
- Profile button shows user initials or User icon
- Opens `UserProfileModal` on click

### 7. `src/components/planning/InitialInputForm.tsx`
**Complete replacement** with new fields:
- `destination` (text, required)
- `destination_cities` (MultiTextInput, optional)
- `start_date`, `end_date` (DatePickerField, required)
- `budget` (number input, required, >0)
- `currency` (Select dropdown)
- `travel_party` (Select dropdown)
- `budget_scope` (radio group)

Export new `TripInputFormData` interface.

### 8. `src/app/plan/page.tsx`
Major changes to Step 2 (Clarification):

**New imports:**
- `useClarificationStore`
- `startClarificationSession`, `submitClarificationResponses`
- `QuestionCard`, `CompletenessProgress`, `ClarificationSummary`, `ApiError`

**New form handler:**
```typescript
const handleFormSubmit = async (formData: TripInputFormData) => {
  const request: StartSessionRequest = {
    user_name: userProfile.user_name || 'Guest',
    destination: formData.destination,
    destination_cities: formData.destination_cities,
    start_date: format(formData.start_date, 'yyyy-MM-dd'),
    end_date: format(formData.end_date, 'yyyy-MM-dd'),
    budget: formData.budget,
    currency: formData.currency,
    travel_party: formData.travel_party,
    budget_scope: formData.budget_scope,
    // Include user profile fields...
  };

  const response = await startClarificationSession(request);
  startSession(response.session_id, response.questions, response.state.completeness_score);
  setCurrentStep(STEP_CLARIFICATION);
};
```

**Replace STEP_CLARIFICATION render:**
- Show `CompletenessProgress` at top
- If `status !== 'complete'`: render `QuestionCard` for each question + Submit button
- If `status === 'complete'`: render `ClarificationSummary` + "Continue to Planning" button
- Handle errors with `ApiError` component

**New submit handler:**
```typescript
const handleSubmitAnswers = async () => {
  const responses = Object.fromEntries(
    Object.values(answers).map(a => [a.field, a.selected_options])
  );
  const result = await submitClarificationResponses(sessionId, responses);

  if (result.complete) {
    setComplete(result.collected_data);
  } else {
    setQuestions(result.questions);
    setCompletenessScore(result.state.completeness_score);
  }
};
```

---

## Component Architecture

```
src/
├── components/
│   ├── form/                      # NEW - Reusable form primitives
│   │   ├── FormField.tsx
│   │   ├── DatePickerField.tsx
│   │   ├── MultiTextInput.tsx
│   │   └── index.ts
│   ├── clarification/             # NEW - Clarification UI
│   │   ├── QuestionCard.tsx
│   │   ├── CompletenessProgress.tsx
│   │   ├── ClarificationSummary.tsx
│   │   ├── ApiError.tsx
│   │   └── index.ts
│   ├── UserProfileModal.tsx       # NEW
│   ├── Navbar.tsx                 # MODIFY - add profile button
│   └── planning/
│       └── InitialInputForm.tsx   # REPLACE
├── store/
│   ├── clarification-store.ts     # NEW
│   ├── trip-store.ts              # MODIFY - add persist
│   └── index.ts                   # MODIFY - add export
├── lib/
│   ├── api/                       # NEW
│   │   ├── clarification.ts
│   │   └── index.ts
│   └── constants.ts               # MODIFY - add options
├── types/
│   ├── clarification.ts           # NEW
│   ├── trip.ts                    # MODIFY - UserProfile
│   └── index.ts                   # MODIFY - add export
└── app/
    └── plan/
        └── page.tsx               # MODIFY - new flow
```

---

## Flow Diagram

```
Landing Page (with Profile Button in Navbar)
    │
    ▼ Click "Start Planning"
Plan Page - Step 1: Input Form
    │ Submit destination, dates, budget, etc.
    ▼ POST /api/clarification/start
Plan Page - Step 2: Clarification Questions
    │ Render questions from backend
    │ User selects options (radio/checkbox)
    ▼ POST /api/clarification/respond
    │ Loop until complete=true
    ▼
Plan Page - Step 2b: Summary
    │ Show collected_data
    ▼ Click "Continue"
Plan Page - Step 3: Day Planning (existing)
    │
    ▼
Plan Page - Step 4: Review (existing)
```

---

## Error Handling

- Backend offline → Show `ApiError` with "Backend not responding" message and retry button
- 404 Session not found → Reset clarification state, show error
- 422 Validation error → Show field-level errors
- Network error → Catch and display with retry option

---

## Verification Steps

1. **Profile Modal:**
   - Click profile button in navbar → modal opens
   - Fill fields, save → check localStorage has data
   - Refresh page → profile data persists

2. **Input Form:**
   - All required fields validate properly
   - Date picker works, budget must be >0
   - Multi-city input adds/removes cities

3. **Clarification Flow:**
   - Start backend: `cd backend && python -m uvicorn main:app --reload`
   - Submit form → POST to `/api/clarification/start` succeeds
   - Questions render with correct UI (radio vs checkbox)
   - Submit answers → more questions or complete
   - Summary shows all collected data

4. **Error Case:**
   - Stop backend → Submit form → Error message appears
   - Click retry → Request retries

5. **End-to-end:**
   - Complete clarification → Summary shown → Continue to planning → Existing flow works

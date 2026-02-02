# Plan: Remove Unused Mock Clarification Questions

## Summary
Remove the legacy mock clarification questions and related dead code that are no longer used since the app now uses the real Python FastAPI backend for clarification.

## Background
- The clarification phase was migrated to use the real backend (`/api/clarification/start`, `/api/clarification/respond`)
- The old mock clarification data in `mock-responses.ts` and handler in `chat/route.ts` are now dead code
- The `useChat` hook is also unused (defined but never imported anywhere)

## Files to Modify

### 1. `src/lib/mock-data/mock-responses.ts`
**Remove:**
- Lines 1-2: Comments about clarification chat phase
- Lines 4-8: `ClarificationQuestion` interface
- Lines 10-26: `CLARIFICATION_QUESTIONS` array
- Lines 28-29: `CLARIFICATION_COMPLETE_MESSAGE` export

**Keep:**
- `RESEARCH_COMPLETE_MESSAGE` (still used in planning phase)
- All day planning messages (`getDayIntroMessage`, `getDayConfirmationMessage`, etc.)

### 2. `src/app/api/mock/chat/route.ts`
**Remove:**
- Lines 3-4: Imports of `CLARIFICATION_QUESTIONS`, `CLARIFICATION_COMPLETE_MESSAGE`
- Lines 43-45: `case 'clarification':` and `handleClarificationPhase` call
- Lines 62-99: Entire `handleClarificationPhase` function

**Update:**
- Line 19: Remove `clarification_step` from `ChatRequestBody.context` interface (optional, but cleaner)

### 3. `src/hooks/use-chat.ts` (Optional Cleanup)
This entire file is unused. Can be deleted if desired, but this is tangential to the main request.

## Verification

After changes:
1. Run `npm run build` - should compile without errors
2. Run `npm run lint` - should pass
3. Run `npx tsc --noEmit` - should have no type errors
4. Test the app flow:
   - Start the dev server: `npm run dev`
   - Navigate to `/plan`
   - Fill in trip details
   - Verify clarification questions come from backend (requires FastAPI running)
   - Verify "Continue to Planning" works
   - Verify day planning options appear correctly

## Impact
- No user-facing changes (removing dead code only)
- Reduces bundle size slightly
- Improves code maintainability by removing legacy code

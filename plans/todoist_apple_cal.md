# Unified Plan: Apple Calendar + Todoist Export

## Goal

Extend the existing Google Calendar export flow into a single provider-based export system that supports:

- Google Calendar
- Apple Calendar via `.ics` download
- Todoist via API token + project export

The user experience should stay simple:

`Add to Calendar` -> open one export modal -> choose provider -> configure provider-specific options -> export

This combines the useful parts of the two separate plans into one implementation path that scales past just Apple and Todoist.

---

## Why This Combined Plan

The two source plans overlap heavily but disagree on the UI seam:

- The Apple plan adds a second modal and a dropdown in the itinerary header.
- The Todoist plan keeps a single modal and adds a provider selector inside it.

The single-modal approach is the better long-term architecture because:

- it avoids duplicating modal state and close/reset behavior
- it keeps `ItineraryHeader` simple
- it scales naturally to 3 providers instead of hardcoding one modal per provider
- it allows `block` vs `detailed` export mode to remain shared UI across providers

So the merged plan keeps one `Add to Calendar` button and one modal, then adds provider-specific sections inside that modal.

---

## Current State

The app already has a working Google Calendar export flow:

- [src/components/calendar/CalendarExportModal.tsx](/Users/Spare/Desktop/agentic-travel-planner/src/components/calendar/CalendarExportModal.tsx)
- [src/hooks/use-calendar-export.ts](/Users/Spare/Desktop/agentic-travel-planner/src/hooks/use-calendar-export.ts)
- [src/store/calendar-store.ts](/Users/Spare/Desktop/agentic-travel-planner/src/store/calendar-store.ts)
- [src/lib/calendar/transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/transformer.ts)
- [src/app/api/calendar/calendars/route.ts](/Users/Spare/Desktop/agentic-travel-planner/src/app/api/calendar/calendars/route.ts)
- [src/app/api/calendar/export/route.ts](/Users/Spare/Desktop/agentic-travel-planner/src/app/api/calendar/export/route.ts)

That means this feature should be built as an extension of the current export system, not as parallel ad hoc flows.

---

## Unified Product Behavior

### Entry point

Keep the existing `Add to Calendar` button in:

- [src/components/itinerary/ItineraryHeader.tsx](/Users/Spare/Desktop/agentic-travel-planner/src/components/itinerary/ItineraryHeader.tsx)

Do not add a header dropdown.

### Modal flow

Open the existing modal and add a provider selector at the top:

- `Google Calendar`
- `Apple Calendar (.ics)`
- `Todoist`

Shared modal structure:

1. Provider selector
2. Shared export mode selector: `Block trip dates` or `Add all events`
3. Provider-specific configuration
4. Export button
5. Shared success and error states

### Provider-specific behavior

#### Google Calendar

Keep the current flow:

- Google auth via NextAuth
- calendar picker
- POST to existing Google export route

#### Apple Calendar

No auth.

The export is fully client-side:

- transform itinerary into RFC 5545 iCalendar content
- create Blob with `text/calendar`
- trigger browser download
- let the user open the `.ics` file in Apple Calendar

#### Todoist

No OAuth for MVP.

Use API token + project selection:

- user pastes Todoist API token
- modal loads Todoist projects
- export creates one task or many tasks depending on export mode

---

## Architecture

### Store strategy

Extend the existing calendar store with provider state, but do not store sensitive Todoist token data in Zustand.

Recommended store additions in:

- [src/store/calendar-store.ts](/Users/Spare/Desktop/agentic-travel-planner/src/store/calendar-store.ts)

Add:

```ts
exportProvider: 'google' | 'apple' | 'todoist';
```

Possibly add provider-specific non-sensitive state:

```ts
selectedProjectId: string | null;
todoistProjects: TodoistProject[];
```

Keep `exportMode` shared:

```ts
exportMode: 'block' | 'detailed';
```

Do not put `todoistApiToken` in Zustand. Keep it in component or hook state so it is cleared on close and not exposed in global app state unnecessarily.

### Status model

The current `exportStatus` is Google-shaped because it includes `fetching_calendars`.

Refactor it into provider-neutral statuses such as:

```ts
'idle' | 'loading_destination' | 'exporting' | 'success' | 'error'
```

Then interpret `loading_destination` as:

- loading calendars for Google
- loading projects for Todoist
- unused for Apple

### Transformer layout

Extract shared helpers from:

- [src/lib/calendar/transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/transformer.ts)

Into:

- [src/lib/calendar/utils.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/utils.ts)

Shared helpers should include:

```ts
getPrimaryEvents(day)
addOneDay(dateStr)
formatTime(time)
buildEventDescription(event)
```

Then keep provider-specific transformers separate:

- [src/lib/calendar/transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/transformer.ts) for Google
- [src/lib/calendar/ics-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/ics-transformer.ts) for Apple
- [src/lib/calendar/todoist-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/todoist-transformer.ts) for Todoist

This is cleaner than forcing all providers into one transformer file.

---

## File Plan

### New files

1. `src/lib/calendar/utils.ts`
2. `src/lib/calendar/ics-transformer.ts`
3. `src/lib/calendar/todoist-transformer.ts`
4. `src/app/api/todoist/projects/route.ts`
5. `src/app/api/todoist/export/route.ts`
6. `vitest.config.ts`
7. Provider-specific tests under `src/lib/calendar/`
8. Optional route tests if test setup supports them

### Modified files

1. `src/components/calendar/CalendarExportModal.tsx`
2. `src/hooks/use-calendar-export.ts`
3. `src/store/calendar-store.ts`
4. `src/lib/calendar/transformer.ts`
5. `src/app/itinerary/[id]/page.tsx` only if modal wiring changes
6. `package.json`
7. `codebase_guide.md`

### Files intentionally left alone

1. `src/components/itinerary/ItineraryHeader.tsx`

Reason: the existing button is already the right entry point. No need to add a header dropdown.

---

## Provider Details

### Google Calendar

Google remains the reference implementation.

Reuse:

- NextAuth session flow
- calendar fetch route
- calendar export route
- existing modal success and error handling

Expected changes:

- move Google-only UI behind `exportProvider === 'google'`
- preserve existing behavior with minimal regression risk

### Apple Calendar

Create:

- [src/lib/calendar/ics-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/ics-transformer.ts)

Functions:

```ts
generateICSContent(itinerary, tripData, mode)
buildBlockVEvent(itinerary, tripData)
buildDetailedVEvents(itinerary)
buildVEvent(...)
escapeICSText(text)
formatICSDate(dateStr)
formatICSDateTime(dateStr, time)
```

Important implementation rules:

- `DTEND` must be exclusive for all-day events
- escape commas, semicolons, backslashes, and newlines correctly
- apply escaping to summary, description, and location
- use stable UIDs
- generate `DTSTAMP` in UTC

Apple UI inside the modal:

- export mode radio group
- download button
- success message after file creation

No API route needed.

### Todoist

Create:

- [src/lib/calendar/todoist-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/todoist-transformer.ts)
- [src/app/api/todoist/projects/route.ts](/Users/Spare/Desktop/agentic-travel-planner/src/app/api/todoist/projects/route.ts)
- [src/app/api/todoist/export/route.ts](/Users/Spare/Desktop/agentic-travel-planner/src/app/api/todoist/export/route.ts)

Todoist task model:

```ts
interface TodoistTask {
  content: string;
  description?: string;
  due_date?: string;
  due_datetime?: string;
  project_id?: string;
}
```

Behavior:

- `block` mode creates one task for the trip
- `detailed` mode creates one task per primary itinerary event
- use `day.date + event.time_start` for `due_datetime`
- skip events missing required time data instead of crashing

Todoist UI inside the modal:

- token input
- load projects button
- project picker
- export button

Error handling:

- explicit invalid-token messaging on 401
- partial-success handling for mixed batch results
- no fake success when token is missing; show actionable error instead

Batching:

- use limited parallelism for task creation
- batch in small groups such as 10 to 20 requests

---

## Recommended Modal Structure

`CalendarExportModal` should become provider-aware rather than Google-only.

Suggested structure:

```txt
Dialog
  Header
    Title: Export itinerary
    Description: Choose a destination for this trip

  Provider Select
    Google Calendar
    Apple Calendar (.ics)
    Todoist

  Export Mode RadioGroup
    Block trip dates
    Add all events

  Provider Panel
    if google:
      auth state
      calendar picker
      export button

    if apple:
      .ics explanation
      download button

    if todoist:
      API token input
      load projects
      project picker
      export button

  Shared success/error notices
```

This keeps one mental model for users and one modal lifecycle for engineering.

---

## Hook Strategy

Extend:

- [src/hooks/use-calendar-export.ts](/Users/Spare/Desktop/agentic-travel-planner/src/hooks/use-calendar-export.ts)

Responsibilities:

- manage provider-specific loading/export actions
- expose Google auth state
- fetch Google calendars
- fetch Todoist projects
- execute Google export
- execute Apple download
- execute Todoist export

Suggested API shape:

```ts
{
  exportProvider,
  setExportProvider,
  exportMode,
  setExportMode,
  exportStatus,
  errorMessage,
  exportedEventCount,
  calendars,
  selectedCalendarId,
  fetchCalendars,
  executeGoogleExport,
  executeAppleExport,
  todoistProjects,
  selectedProjectId,
  setSelectedProject,
  fetchTodoistProjects,
  executeTodoistExport,
  isAuthenticated,
  isLoading,
  handleSignIn,
}
```

Internally, the modal can either call provider-specific functions directly or call one `executeExport()` dispatcher based on `exportProvider`.

---

## Security Notes

### Todoist token

Do not persist it.

Do not put it in Zustand.

Keep it:

- in local component state, or
- in hook-local state that resets when the modal closes

This reduces exposure in devtools and avoids carrying secrets around the app unnecessarily.

### Apple ICS content

All user-generated strings must be escaped before being written into `.ics`.

This is correctness, not just hygiene. Unescaped commas and backslashes can break the file format.

---

## Testing Plan

The repo currently has no test runner configured in:

- [package.json](/Users/Spare/Desktop/agentic-travel-planner/package.json)

Add:

- `vitest`
- test script in `package.json`
- `vitest.config.ts`

### Unit tests

#### Shared utils

- `getPrimaryEvents` filters alternatives correctly
- `addOneDay` returns the correct exclusive end date
- `formatTime` normalizes `9:00` to `09:00`

#### Apple ICS

- calendar content contains `BEGIN:VCALENDAR`
- block mode creates one `VEVENT`
- detailed mode creates multiple `VEVENT`s
- commas, newlines, and backslashes are escaped correctly
- events missing required time data are skipped safely

#### Todoist transformer

- block task has correct content and due date
- detailed tasks use `due_datetime`
- non-primary alternatives are excluded
- missing `time_start` does not crash transformation

### Route tests

#### Todoist projects route

- returns 401-friendly error for bad token
- returns mapped project list for valid token
- handles upstream failure cleanly

#### Todoist export route

- validates missing body fields
- returns partial results when some task creates fail
- handles full success

### Manual verification

1. Google export still works as it does now
2. Apple export downloads a valid `.ics`
3. Apple `.ics` imports into Apple Calendar successfully
4. Todoist project loading works with a valid token
5. Todoist export creates tasks in both block and detailed modes
6. Invalid Todoist token shows a clear error message

---

## Failure Modes

| Area | Risk | Mitigation |
|---|---|---|
| Modal architecture | Provider-specific state leaks when switching providers | Reset provider-local UI state when provider changes or modal closes |
| Google regression | Refactor breaks current working flow | Keep Google UI/logic intact first, then wrap conditionally |
| Apple ICS | Invalid escaping corrupts import | Unit test escape logic and event generation |
| Apple ICS | Missing dates/times produce malformed file | Guard and skip invalid detailed events |
| Todoist auth | Bad token shows vague failure | Return explicit 401 message from route and surface it in UI |
| Todoist export | Large itinerary hits rate limits | Batch requests with capped concurrency |
| Sensitive data | Token exposed in shared store | Keep token out of Zustand |

---

## What Is Out of Scope

- Todoist OAuth
- bidirectional sync from providers back into the itinerary
- Outlook-specific UX
- CalDAV integration
- separate provider-specific modals
- header-level provider dropdown

These can be revisited later if a broader export framework is needed.

---

## Stage-by-Stage Implementation Plan

### Stage 1: Foundation refactor

Goal: make the existing export system provider-aware without changing the entry point.

Tasks:

1. Add `exportProvider` to [src/store/calendar-store.ts](/Users/Spare/Desktop/agentic-travel-planner/src/store/calendar-store.ts)
2. Refactor export statuses to be provider-neutral
3. Extract shared transformer helpers into [src/lib/calendar/utils.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/utils.ts)
4. Keep the current Google export fully working

Definition of done:

- Google export still works exactly as before
- modal can track provider state cleanly

### Stage 2: Provider-aware modal shell

Goal: convert the current Google modal into a multi-provider modal.

Tasks:

1. Update [src/components/calendar/CalendarExportModal.tsx](/Users/Spare/Desktop/agentic-travel-planner/src/components/calendar/CalendarExportModal.tsx)
2. Add top-level provider selector
3. Keep shared export mode outside provider-specific sections
4. Render Google panel conditionally

Definition of done:

- one modal supports provider switching
- Google is the default provider
- no Apple or Todoist export yet

### Stage 3: Apple Calendar support

Goal: ship the simplest second provider first.

Tasks:

1. Add [src/lib/calendar/ics-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/ics-transformer.ts)
2. Add Apple panel UI in the existing modal
3. Implement client-side file download
4. Add unit tests for ICS generation and escaping

Definition of done:

- user can download a valid `.ics` file in both export modes
- file imports into Apple Calendar

### Stage 4: Todoist support

Goal: add the more complex provider after the provider shell is proven.

Tasks:

1. Add [src/lib/calendar/todoist-transformer.ts](/Users/Spare/Desktop/agentic-travel-planner/src/lib/calendar/todoist-transformer.ts)
2. Add `/api/todoist/projects`
3. Add `/api/todoist/export`
4. Add Todoist provider UI to the modal
5. Add error handling for invalid token and partial success

Definition of done:

- valid token loads projects
- export creates Todoist tasks
- invalid token produces a clear message

### Stage 5: Hardening and cleanup

Goal: make the system reliable and maintainable.

Tasks:

1. Add Vitest configuration and scripts
2. Add transformer and route tests
3. Update [codebase_guide.md](/Users/Spare/Desktop/agentic-travel-planner/codebase_guide.md)
4. Review naming and shared abstractions

Definition of done:

- provider flows are covered by tests
- codebase guide reflects new files and architecture

---

## Final Recommendation

Build this in the following order:

1. Provider-aware foundation
2. Apple export
3. Todoist export
4. Tests and cleanup

Apple should come before Todoist because it validates the multi-provider design with much lower complexity. Once that structure is working, Todoist becomes a contained provider addition rather than another architectural rewrite.

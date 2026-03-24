# Frontend Architecture

This frontend should stay organized around a simple rule: route files render screens, hooks orchestrate workflows, stores hold shared client state, and `lib/` owns side effects and data adapters.

## Layers

`src/app`

- Route composition only.
- Read data from hooks/stores and render sections.
- Avoid request logic, state machines, and transformation-heavy code in route files.

`src/hooks`

- Own feature workflows and screen orchestration.
- Good place for request deduping, optimistic UI, derived state, and multi-step flows.
- Hooks should be reusable from pages and feature shells without copying logic.

`src/store`

- Hold cross-screen client state and mutation primitives.
- Keep actions focused on state transitions, not fetch orchestration.
- Prefer one store per domain (`trip`, `chat`, `itinerary`, `calendar`).

`src/lib`

- Own API adapters, constants, utility transforms, and pure helpers.
- Browser and backend boundaries should be centralized here instead of scattered across UI files.

`src/components`

- Presentational and interaction components only.
- Components should receive explicit props or read from a narrow feature context.
- Avoid embedding route-specific business logic in reusable UI.

## Current Conventions

Planning flow

- `/plan` renders the wizard.
- `usePlanningWizard` owns clarification session orchestration.
- `useDayPlanning` owns day-by-day planning state and request coordination.

Itinerary editing

- `/itinerary/[id]` composes the editor surface.
- `useItineraryEdit` owns validation, undo, conflict handling, and edit actions.
- `ItineraryProvider` exposes only the state/actions needed by the timeline tree.

Networking

- Reuse `src/lib/api` adapters for backend communication where possible.
- Do not create ad hoc `fetch` error handling inside pages.
- Reuse a stable conversation/session identifier for multi-step backend flows.

Persistence

- Treat trip data and itinerary snapshots as keyed client-side records, not only as active in-memory state.
- Route hydration for `/itinerary/[id]` should resolve against persisted trip and itinerary registries before showing an empty state.
- Persisted registries should store replaceable snapshots, not component-specific UI state.

## Scalability Rules

When adding a feature:

1. Put raw fetch logic in `lib/` or a feature hook.
2. Keep route files under orchestration-free rendering whenever possible.
3. Share workflow logic through hooks before introducing another store.
4. Introduce a store only when state must survive across siblings, screens, or modal trees.
5. Prefer typed feature contracts in `src/types` over importing component-local types across layers.

When refactoring:

1. Remove duplicated workflow code from pages first.
2. Make state ownership obvious before optimizing visuals.
3. Fix correctness bugs before adding abstraction.
4. Keep backward-compatible component APIs only when there is an actual caller.

## Known Follow-Up Areas

- Version history is still backed by a mock in-memory API route, so restoring full history across server restarts will require a real persistence layer.
- The persisted stores currently assume local browser storage; server-backed persistence will need an explicit repository boundary when real trip data is introduced.

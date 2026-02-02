# Itinerary Versioning Feature Implementation Plan

## Overview
Implement GitHub-style version history for itinerary changes. Each "Apply Changes" creates a new version (v1, v2, v3...). Users can view past versions via a slide-out drawer, preview them read-only, and optionally restore.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ItineraryHeader                               │
│  [Undo] [Apply Changes] [Optimize] [History ▼]  ← NEW BUTTON    │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              VersionHistoryDrawer (slide-out right)             │
├─────────────────────────────────────────────────────────────────┤
│  Today, Feb 2                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● v3                                    2:30 PM   [View]│   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● v2                                    1:15 PM   [View]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Yesterday, Feb 1                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● v1                                    4:00 PM   [View]│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New Type: `ItineraryVersion`
```typescript
// src/types/version.ts
interface ItineraryVersion {
  id: string;                    // "ver_1706785643210"
  version_number: number;        // 1, 2, 3...
  trip_id: string;               // Links to itinerary
  snapshot: Itinerary;           // Full itinerary at this point
  created_at: string;            // ISO timestamp
}

interface VersionHistoryResponse {
  versions: ItineraryVersion[];
  current_version: number;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/version.ts` | Version type definitions |
| `src/app/api/mock/versions/route.ts` | Mock API for version CRUD |
| `src/components/itinerary/VersionHistoryDrawer.tsx` | Slide-out drawer component |
| `src/components/itinerary/VersionItem.tsx` | Single version row (GitHub-style) |
| `src/components/itinerary/VersionPreviewModal.tsx` | Read-only itinerary preview |
| `src/hooks/use-version-history.ts` | Hook for version operations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Export new version types |
| `src/store/itinerary-store.ts` | Add `currentVersion` field |
| `src/hooks/use-itinerary-edit.ts` | Call version API on `applyChanges()` |
| `src/app/itinerary/[id]/page.tsx` | Add History button + drawer state |
| `src/components/itinerary/ItineraryHeader.tsx` | Add History button |
| `src/components/itinerary/index.ts` | Export new components |

---

## Implementation Steps

### Step 1: Types
Create `src/types/version.ts` with `ItineraryVersion` interface and export from `src/types/index.ts`.

### Step 2: Mock API
Create `src/app/api/mock/versions/route.ts`:
- `GET /api/mock/versions?trip_id={id}` - Fetch version history
- `POST /api/mock/versions` - Create new version (on apply changes)

Store versions in memory (array) for the mock. Return grouped by date.

### Step 3: Store Update
Add to `itinerary-store.ts`:
- `currentVersion: number | null` - Current version number
- `setCurrentVersion(version: number)` action

### Step 4: Version History Hook
Create `src/hooks/use-version-history.ts`:
```typescript
function useVersionHistory(tripId: string) {
  // Fetch versions with React Query
  // Create version function
  // Restore version function
  return { versions, isLoading, createVersion, restoreVersion };
}
```

### Step 5: UI Components

**VersionHistoryDrawer**: Slide-out Sheet from shadcn/ui
- Groups versions by date (like GitHub)
- Shows version number, timestamp
- Click to open preview

**VersionItem**: Single row component
- Circle indicator (like commit dot)
- Version label (v1, v2, v3)
- Relative timestamp
- View button

**VersionPreviewModal**: Dialog with read-only itinerary
- Shows full itinerary at that version
- "Restore this version" button
- Close button

### Step 6: Integration
Modify `use-itinerary-edit.ts`:
- After successful `applyChanges()`, call `createVersion()`
- Pass current itinerary snapshot to API

Update `itinerary/[id]/page.tsx`:
- Add drawer open state
- Render VersionHistoryDrawer
- Add History button to header

---

## UI Design Details

### Version Item (GitHub-style)
```
┌────────────────────────────────────────────────────────────┐
│  ●  v3                                    2:30 PM   [View] │
│     └─ Commit dot (blue-600)              └─ Relative time │
└────────────────────────────────────────────────────────────┘
```

### Date Grouping
- "Today" for current day
- "Yesterday" for previous day
- Full date for older (e.g., "Jan 30, 2026")

### Drawer Styling
- Width: 400px
- Background: white
- Border-left: slate-200
- Header: "Version History" with close button

---

## Verification Plan

1. **Create versions**: Apply changes multiple times, verify versions appear in drawer
2. **Date grouping**: Create versions across different days, verify correct grouping
3. **Preview**: Click view on old version, verify read-only preview shows
4. **Restore**: Restore an old version, verify itinerary updates and new version created
5. **Persistence**: Refresh page, verify versions still available (via mock API)

---

## Dependencies
- shadcn/ui `Sheet` component (**needs to be installed**: `npx shadcn@latest add sheet`)
- shadcn/ui `Dialog` component (already available)
- React Query for data fetching (already in project)

---

## Implementation Order

1. **Install Sheet component**: `npx shadcn@latest add sheet`
2. **Create types** (`src/types/version.ts`)
3. **Create mock API** (`src/app/api/mock/versions/route.ts`)
4. **Update itinerary store** (add `currentVersion` field)
5. **Create hook** (`src/hooks/use-version-history.ts`)
6. **Create VersionItem component** (single row)
7. **Create VersionHistoryDrawer** (slide-out panel)
8. **Create VersionPreviewModal** (read-only preview)
9. **Update ItineraryHeader** (add History button)
10. **Update itinerary page** (integrate drawer + version creation on apply)
11. **Update barrel exports** (`index.ts` files)

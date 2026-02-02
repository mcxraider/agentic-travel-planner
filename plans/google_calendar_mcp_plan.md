# Google Calendar Integration for Itinerary Export

## Overview

Add the ability for users to export their itinerary to Google Calendar directly from the itinerary page. Users can authenticate with Google OAuth and choose to either block out trip dates as a single event OR add all activities as individual calendar events.

**Scope:** Google Calendar only (Notion integration deferred to future iteration)

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Itinerary Page                           │
│  ┌──────────────────┐     ┌─────────────────────────────────┐  │
│  │ ItineraryHeader  │────▶│ CalendarExportDropdown          │  │
│  └──────────────────┘     │  └─ "Add to Calendar" button    │  │
│                           └─────────────────────────────────┘  │
│                                        │                        │
│                                        ▼                        │
│                           ┌─────────────────────────────────┐  │
│                           │ CalendarExportModal             │  │
│                           │  - Export mode selection        │  │
│                           │  - Google auth status           │  │
│                           │  - Export button                │  │
│                           └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
         ┌──────────────────┐                   ┌──────────────────┐
         │ Google OAuth     │                   │ Calendar API     │
         │ /api/auth/google │                   │ /api/calendar/   │
         │ (NextAuth.js)    │                   │ export           │
         └──────────────────┘                   └──────────────────┘
```

### Data Flow

1. User clicks "Add to Calendar" in header dropdown
2. Modal opens showing export options
3. If not authenticated with Google, show "Connect Google Calendar" button
4. User authenticates via Google OAuth (handled by NextAuth.js)
5. User selects export mode: "Block trip dates" or "Add all events"
6. User clicks "Export to Calendar"
7. API route transforms itinerary data → Google Calendar events
8. Google Calendar API creates events
9. Success/error feedback shown to user

---

## Implementation Plan

### Phase 1: Google OAuth Setup

#### 1.1 Install Dependencies
```bash
npm install next-auth @auth/core googleapis
```

**Files to create/modify:**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/lib/auth.ts` - Auth configuration
- `.env.local` - Environment variables (template)

#### 1.2 Google Cloud Setup (Instructions for user)
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Calendar API
4. Configure OAuth consent screen (External, add test users)
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### 1.3 Environment Variables
```env
# .env.local
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

---

### Phase 2: State Management

#### 2.1 Create Calendar Integration Store
**File:** `src/store/calendar-store.ts`

```typescript
interface CalendarState {
  // Modal state
  exportModalOpen: boolean;

  // Export options
  exportMode: 'block' | 'detailed';

  // Export progress
  exportStatus: 'idle' | 'exporting' | 'success' | 'error';
  exportError: string | null;
  exportedEventCount: number;
}

interface CalendarActions {
  openExportModal: () => void;
  closeExportModal: () => void;
  setExportMode: (mode: 'block' | 'detailed') => void;
  setExportStatus: (status: CalendarState['exportStatus']) => void;
  setExportError: (error: string | null) => void;
  setExportedEventCount: (count: number) => void;
  reset: () => void;
}
```

#### 2.2 Update Store Index
**File:** `src/store/index.ts` - Add export for calendar store

---

### Phase 3: Calendar Data Transformer

#### 3.1 Create Calendar Transformer
**File:** `src/lib/calendar/transformer.ts`

Transform itinerary data to Google Calendar event format:

```typescript
interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone: string };
  end: { dateTime?: string; date?: string; timeZone: string };
}

// For "block" mode - single all-day event
function createBlockEvent(tripData: TripData): CalendarEventInput

// For "detailed" mode - individual events
function createDetailedEvents(
  itinerary: Itinerary,
  tripData: TripData
): CalendarEventInput[]
```

**Event format for "Block trip dates":**
- Summary: "Trip to [Destination]"
- All-day event spanning startDate to endDate
- Description: Trip overview with total days, travelers, budget

**Event format for "Add all events":**
- Summary: Event title
- Start/End: Combine day date + event time_start/time_end
- Location: Event location name + address (if available)
- Description: Event description + cost + booking info

---

### Phase 4: API Routes

#### 4.1 Calendar Export API Route
**File:** `src/app/api/calendar/export/route.ts`

```typescript
POST /api/calendar/export
Body: {
  mode: 'block' | 'detailed',
  itinerary: Itinerary,
  tripData: TripData
}
Response: {
  success: boolean,
  eventCount: number,
  calendarUrl?: string,
  error?: string
}
```

**Logic:**
1. Get authenticated user's Google access token from session
2. Transform itinerary data based on mode
3. Use googleapis to create calendar events
4. Return success/failure with event count

#### 4.2 Auth Check API Route
**File:** `src/app/api/auth/status/route.ts`

```typescript
GET /api/auth/status
Response: {
  authenticated: boolean,
  provider?: 'google',
  email?: string
}
```

---

### Phase 5: UI Components

#### 5.1 Calendar Export Dropdown
**File:** `src/components/itinerary/CalendarExportDropdown.tsx`

A dropdown button to be added to ItineraryHeader:
- Uses shadcn/ui DropdownMenu
- Single item: "Add to Calendar" with Calendar icon
- Opens CalendarExportModal on click

#### 5.2 Calendar Export Modal
**File:** `src/components/calendar/CalendarExportModal.tsx`

```
┌─────────────────────────────────────────┐
│  Add to Google Calendar              X  │
├─────────────────────────────────────────┤
│                                         │
│  [Google Account Status]                │
│  ✓ Connected as user@gmail.com          │
│  or                                     │
│  [Connect Google Calendar] button       │
│                                         │
├─────────────────────────────────────────┤
│  How would you like to add this trip?   │
│                                         │
│  ○ Block trip dates only                │
│    Creates 1 all-day event              │
│    Mar 15 - Mar 20, 2024                │
│                                         │
│  ● Add all events with times            │
│    Creates 24 calendar events           │
│    with specific times and details      │
│                                         │
├─────────────────────────────────────────┤
│  Preview:                               │
│  ┌─────────────────────────────────┐   │
│  │ • Day 1: 4 events               │   │
│  │ • Day 2: 6 events               │   │
│  │ • Day 3: 5 events               │   │
│  │ ...                              │   │
│  └─────────────────────────────────┘   │
│                                         │
│           [Export to Calendar]          │
│                                         │
│  [Exporting... spinner]                 │
│  or                                     │
│  ✓ Successfully added X events!         │
│  [Open Google Calendar]                 │
└─────────────────────────────────────────┘
```

**States:**
- Not authenticated: Show connect button
- Authenticated: Show export options
- Exporting: Show spinner
- Success: Show success message + link to calendar
- Error: Show error message + retry button

#### 5.3 Update ItineraryHeader
**File:** `src/components/itinerary/ItineraryHeader.tsx`

Add CalendarExportDropdown between "Optimize" and "Apply Changes" buttons.

New props needed:
```typescript
interface ItineraryHeaderProps {
  // ... existing props
  onOpenCalendarExport: () => void;
}
```

---

### Phase 6: Integration & Wiring

#### 6.1 Update Itinerary Page
**File:** `src/app/itinerary/[id]/page.tsx`

- Import and use CalendarExportModal
- Import useCalendarStore
- Wire up modal open/close handlers
- Pass handler to ItineraryHeader

#### 6.2 Create Custom Hook
**File:** `src/hooks/use-calendar-export.ts`

Encapsulates all calendar export logic:
- Check auth status
- Handle export flow
- Error handling
- Loading states

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route for Google OAuth |
| `src/lib/auth.ts` | NextAuth configuration with Google provider |
| `src/store/calendar-store.ts` | Zustand store for calendar integration state |
| `src/lib/calendar/transformer.ts` | Transform itinerary → Google Calendar events |
| `src/lib/calendar/index.ts` | Barrel export |
| `src/app/api/calendar/export/route.ts` | API route to create calendar events |
| `src/components/itinerary/CalendarExportDropdown.tsx` | Dropdown menu in header |
| `src/components/calendar/CalendarExportModal.tsx` | Main export modal |
| `src/components/calendar/index.ts` | Barrel export |
| `src/hooks/use-calendar-export.ts` | Custom hook for export logic |
| `src/types/calendar.ts` | Calendar-related type definitions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/store/index.ts` | Export calendar store |
| `src/components/itinerary/index.ts` | Export CalendarExportDropdown |
| `src/components/itinerary/ItineraryHeader.tsx` | Add CalendarExportDropdown, new prop |
| `src/app/itinerary/[id]/page.tsx` | Add modal, wire up handlers |
| `package.json` | Add next-auth, googleapis dependencies |
| `.env.local` | Add Google OAuth credentials |

---

## Verification Plan

### Manual Testing Steps

1. **OAuth Flow:**
   - Click "Add to Calendar" when not authenticated
   - Click "Connect Google Calendar"
   - Complete Google OAuth flow
   - Verify redirect back to app
   - Verify "Connected as [email]" shows

2. **Block Mode Export:**
   - Select "Block trip dates only"
   - Click "Export to Calendar"
   - Verify single all-day event created in Google Calendar
   - Verify correct dates and title

3. **Detailed Mode Export:**
   - Select "Add all events with times"
   - Click "Export to Calendar"
   - Verify all events created with correct times
   - Verify locations and descriptions populated

4. **Error Handling:**
   - Test with revoked Google permissions
   - Test with network disconnection
   - Verify error messages display correctly
   - Test retry functionality

5. **Edge Cases:**
   - Export empty itinerary (should disable/warn)
   - Export with events missing times
   - Export with very long descriptions

### Type Checking
```bash
npx tsc --noEmit
```

### Lint Check
```bash
npm run lint
```

---

## Dependencies to Install

```bash
npm install next-auth googleapis
```

---

## Environment Setup Required

Create `.env.local` with:
```env
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

---

## Future Enhancements (Out of Scope)

- Notion integration via Notion OAuth + API
- Two-way sync (calendar changes reflect in app)
- Calendar event updates when itinerary edited
- Multiple calendar selection
- Event color coding by event type
- Recurring trip support

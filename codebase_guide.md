# Agentic Travel Planner - Codebase Navigation Guide

A comprehensive guide for developers working with this AI-powered trip planning application.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Page Routes](#page-routes)
6. [Component System](#component-system)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Type System](#type-system)
10. [Key Patterns](#key-patterns)
11. [Development Workflow](#development-workflow)
12. [Common Tasks](#common-tasks)
13. [File Reference](#file-reference)

---

## Overview

### What This App Does

The Agentic Travel Planner guides users through a 5-step trip planning process:

1. **Input Phase** (`/plan`) - Collect basic trip details (destination, dates, budget)
2. **Clarification Phase** (`/plan`) - AI-driven questions to understand preferences (real backend)
3. **Research Phase** (`/research`) - Loading animation while "researching" the trip, auto-redirects to select
4. **Planning Phase** (`/select`) - Day-by-day itinerary creation with 3 options per day (mock backend)
5. **Review/Editing Phase** (`/select` then `/itinerary/[id]`) - Summary and drag-drop editable itinerary

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (5 stores) |
| Data Fetching | React Query (TanStack Query) |
| Drag & Drop | dnd-kit (@dnd-kit/core) |
| Backend | Python FastAPI + LangGraph (clarification only) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

The app runs at `http://localhost:3000`. The clarification backend expects FastAPI at `http://localhost:8000`.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (/)
│   ├── layout.tsx         # Root layout
│   ├── plan/
│   │   └── page.tsx       # Planning wizard steps 1-2 (/plan)
│   ├── research/
│   │   └── page.tsx       # Research loading page (/research)
│   ├── select/
│   │   └── page.tsx       # Day selection + review (/select)
│   ├── itinerary/
│   │   └── [id]/
│   │       └── page.tsx   # Itinerary editor (/itinerary/[id])
│   ├── api/mock/          # Mock API routes
│   │   ├── chat/
│   │   ├── generate-day/
│   │   └── validate-edit/
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth Google OAuth
│       └── calendar/           # Google Calendar export
│           ├── calendars/      # GET - list user calendars
│           └── export/         # POST - export events
│
├── components/             # React components (67+ files)
│   ├── ui/                # shadcn/ui base components
│   ├── landing/           # Home page components
│   ├── form/              # Reusable form components
│   ├── clarification/     # Clarification phase UI
│   ├── planning/          # Planning phase UI
│   ├── itinerary/         # Itinerary editing UI
│   │   └── EventCard/     # Compound component for events
│   ├── calendar/          # Google Calendar export
│   │   └── CalendarExportModal.tsx
│   ├── Navbar.tsx
│   ├── DebugPanel.tsx
│   └── HealthStatusIndicator.tsx
│
├── store/                  # Zustand state stores
│   ├── trip-store.ts
│   ├── clarification-store.ts
│   ├── chat-store.ts
│   ├── itinerary-store.ts
│   ├── calendar-store.ts
│   ├── debug-store.ts
│   └── index.ts
│
├── hooks/                  # Custom React hooks
│   ├── use-planning-wizard.ts
│   ├── use-chat.ts
│   ├── use-day-planning.ts
│   ├── use-itinerary-edit.ts
│   ├── use-event-alternatives.ts
│   ├── use-calendar-export.ts
│   ├── use-toast.ts
│   ├── use-server-health.ts
│   └── index.ts
│
├── types/                  # TypeScript interfaces
│   ├── trip.ts
│   ├── itinerary.ts
│   ├── chat.ts
│   ├── clarification.ts
│   ├── api.ts
│   ├── next-auth.d.ts     # NextAuth type extensions
│   └── index.ts
│
├── lib/                    # Utilities & API
│   ├── api/               # Backend communication
│   │   ├── clarification.ts
│   │   └── adapters/
│   ├── calendar/          # Google Calendar integration
│   │   ├── auth-provider.ts        # Auth abstraction interface
│   │   ├── auth/google-nextauth-provider.ts
│   │   ├── transformer.ts          # Itinerary → Calendar events
│   │   └── index.ts
│   ├── auth.ts            # NextAuth config
│   ├── mock-data/         # Mock responses
│   ├── constants.ts
│   └── utils.ts
│
├── config/                 # App configuration
│   └── event-types.ts     # Event type registry
│
└── contexts/               # React Context
    └── itinerary-context.tsx
```

---

## Architecture

### Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page    →    Planning Wizard    →    Itinerary Editor  │
│     (/)               (/plan)                 (/itinerary/[id]) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOM HOOKS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  usePlanningWizard   useItineraryEdit   useEventAlternatives   │
│  useChat             useDayPlanning     useServerHealth        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORES                             │
├─────────────────────────────────────────────────────────────────┤
│  TripStore      ClarificationStore    ChatStore                │
│  ItineraryStore DebugStore                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Real Backend (FastAPI)          Mock API Routes                │
│  - /api/clarification/start      - /api/mock/chat              │
│  - /api/clarification/respond    - /api/mock/generate-day      │
│                                  - /api/mock/validate-edit     │
└─────────────────────────────────────────────────────────────────┘
```

### Planning Wizard State Machine

```
┌─────────┐    formSubmit    ┌───────────────┐   allAnswered   ┌──────────┐
│  INPUT  │ ───────────────► │ CLARIFICATION │ ──────────────► │ RESEARCH │
│ (Step 1)│                  │   (Step 2)    │                 │ (Step 3) │
│  /plan  │                  │    /plan      │                 │ /research│
└─────────┘                  └───────────────┘                 └──────────┘
                                                                     │
                                                               auto-redirect
                                                                  (~5s)
                                                                     │
                                                                     ▼
                                                               ┌──────────┐
                                                               │ PLANNING │
                                                               │ (Step 4) │
                                                               │ /select  │
                                                               └──────────┘
                                                                     │
                                                              allDaysLocked
                                                                     │
                                                                     ▼
                                                               ┌──────────┐
                                                               │  REVIEW  │
                                                               │ (Step 5) │
                                                               │ /select  │
                                                               └──────────┘
                                                                     │
                                                              viewItinerary
                                                                     │
                                                                     ▼
                                                           ┌────────────────┐
                                                           │ ITINERARY PAGE │
                                                           │ /itinerary/[id]│
                                                           └────────────────┘
```

---

## Page Routes

### `/` - Landing Page

**File:** `src/app/page.tsx`

Simple composition of landing components:
- `Hero` - Main hero section with headline
- `ProblemStatement` - Value proposition
- `CTASection` - "Start Planning" button

### `/plan` - Input & Clarification

**File:** `src/app/plan/page.tsx`

Steps 1-2 of the planning flow:

| Step | Component(s) | Store(s) |
|------|--------------|----------|
| 1 - Input | `InitialInputForm` | TripStore |
| 2 - Clarification | `QuestionCard`, `ClarificationSummary` | ClarificationStore |

**Key functions:**
- `handleFormSubmit()` - Starts clarification session
- `handleSubmitAnswers()` - Submits clarification round
- `handleProceedToResearch()` - Navigates to `/research`

### `/research` - Research Loading

**File:** `src/app/research/page.tsx`

Step 3 - Shows loading animation with cycling stages while "researching" the trip. Uses mock data fallback if no trip data in store. Auto-redirects to `/select` after ~5 seconds.

### `/select` - Day Selection & Review

**File:** `src/app/select/page.tsx`

Steps 4-5 of the planning flow:

| Step | Component(s) | Store(s) |
|------|--------------|----------|
| 4 - Planning | `ChatWindow`, `OptionCard`, `ItineraryPreview` | ChatStore |
| 5 - Review | Summary display | - |

**Key functions:**
- `handleOptionSelect()` - Locks a day option
- `handlePlanningMessage()` - Handles text input during planning
- `handleViewItinerary()` - Navigates to itinerary page

Works standalone with mock data fallback from `MOCK_RESEARCH_INPUT`.

### `/itinerary/[id]` - Itinerary Editor

**File:** `src/app/itinerary/[id]/page.tsx` (~250 lines)

Full itinerary editing with:
- Drag-drop event reordering
- Add/edit/delete events
- Alternative event cycling
- Conflict detection on save
- Optimization suggestions
- Undo/redo (Ctrl+Z)

**Components used:**
- `ItineraryHeader` - Title bar with action buttons
- `TimelineView` - Day-by-day timeline
- `DayCard` - Single day container
- `EventCard` - Individual event (compound component)
- `EditChatSidebar` - AI suggestions sidebar
- Modal components for add/edit actions

---

## Component System

### Directory Organization

Each feature folder follows this pattern:

```
components/feature/
├── Component1.tsx
├── Component2.tsx
├── SubComponent/       # Complex components get their own folder
│   ├── SubContext.tsx
│   ├── SubRoot.tsx
│   └── index.tsx
└── index.ts            # Barrel export
```

### Component Categories

#### Base UI (`components/ui/`)

shadcn/ui components - pre-styled Radix UI primitives:
- `button.tsx`, `card.tsx`, `dialog.tsx`
- `input.tsx`, `select.tsx`, `textarea.tsx`
- `calendar.tsx`, `popover.tsx`, `badge.tsx`
- And 15+ more...

#### Landing (`components/landing/`)

| Component | Purpose |
|-----------|---------|
| `Hero.tsx` | Main headline and description |
| `ProblemStatement.tsx` | Pain points and solution |
| `CTASection.tsx` | Call-to-action button |

#### Form (`components/form/`)

| Component | Purpose |
|-----------|---------|
| `FormField.tsx` | Generic form field wrapper |
| `DatePickerField.tsx` | Calendar date picker |
| `MultiTextInput.tsx` | Multiple text inputs (destinations, interests) |

#### Clarification (`components/clarification/`)

| Component | Purpose |
|-----------|---------|
| `QuestionCard.tsx` | Renders questions (single/multi-select, ranked, text) |
| `RankedSelector.tsx` | Drag-drop ranked selection (Top 3 must-dos) |
| `CompletenessProgress.tsx` | Progress bar (0-100%) |
| `ClarificationSummary.tsx` | Shows all collected data |
| `ApiError.tsx` | Error display with retry |
| `ConflictWarningBanner.tsx` | Conflicting preferences warning |
| `AgenticLoadingState.tsx` | "AI researching..." spinner |

#### Planning (`components/planning/`)

| Component | Purpose |
|-----------|---------|
| `InitialInputForm.tsx` | Trip basics form |
| `ProgressBar.tsx` | 5-step progress indicator |
| `ChatWindow.tsx` | Main chat interface |
| `MessageBubble.tsx` | Individual message display |
| `MessageInput.tsx` | User text input |
| `TypingIndicator.tsx` | "Agent typing..." animation |
| `OptionCard.tsx` | Day option card (cost, energy, highlights) |
| `ItineraryPreview.tsx` | Sidebar showing locked days |
| `DayCardPreview.tsx` | Preview of single day |

#### Itinerary (`components/itinerary/`)

| Component | Purpose |
|-----------|---------|
| `TimelineView.tsx` | Full timeline of all days |
| `DayCard.tsx` | Single day container |
| `ItineraryHeader.tsx` | Title, action buttons |
| `EditChatSidebar.tsx` | AI suggestions panel |
| `AddEventForm.tsx` | Modal for adding events |
| `AddAlternativeForm.tsx` | Modal for adding alternatives |
| `OptimizationModal.tsx` | Optimization suggestions |
| `ValidationModal.tsx` | Conflict display on save |
| `DragDropContext.tsx` | dnd-kit provider wrapper |

### EventCard Compound Component

**Location:** `components/itinerary/EventCard/`

The most complex component in the codebase, using the compound component pattern:

```typescript
// Structure
EventCard/
├── EventCardContext.tsx     // Context + Provider
├── EventCardRoot.tsx        // Main container
├── EventCardContent.tsx     // Time, title, description
├── EventCardActions.tsx     // Delete, cycle, add alternative buttons
├── EventCardDragHandle.tsx  // Drag handle visual
├── EventCardMetadataDropdown.tsx  // Booking/notes popover
└── index.tsx                // Compound component assembly

// Usage
<EventCard.Provider event={event} dayNumber={1}>
  <EventCard.Root>
    <EventCard.ConflictBadge />
    <EventCard.StackIndicator />
    <EventCard.DragHandle />
    <EventCard.Time />
    <EventCard.Details />
    <EventCard.Actions />
  </EventCard.Root>
</EventCard.Provider>
```

**Benefits:**
- Flexible layout composition
- Loose coupling between parts
- Easy to customize per use-case
- Internal state shared via context

---

## State Management

### Store Overview

Six Zustand stores manage different domains:

```
┌─────────────────────────────────────────────────────────────────┐
│ TripStore                                                       │
│ Purpose: Trip metadata and user profile                         │
│ Persisted: userProfile (across sessions)                        │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   tripData: TripData | null                                     │
│   userProfile: UserProfile                                      │
│   currentPhase: PlanningPhase                                   │
│ Actions:                                                        │
│   setTripData, updateTripData, updateUserProfile, setPhase     │
│   setCurrentPhase, reset                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ClarificationStore                                              │
│ Purpose: Backend clarification session state                    │
│ Persisted: data, status, questionsState                         │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   sessionId: string | null                                      │
│   status: 'idle' | 'in_progress' | 'complete'                  │
│   questions: Question[]                                         │
│   answers: Record<string, unknown>                              │
│   questionsState: QuestionsState                                │
│   data: ClarificationData                                       │
│ Actions:                                                        │
│   startSession, setAnswer, updateFromResponse,                  │
│   setComplete, startEditing, reset                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ChatStore                                                       │
│ Purpose: Planning phase chat messages                           │
│ Persisted: None                                                 │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   messages: ChatMessage[]                                       │
│   isTyping: boolean                                             │
│   currentOptions: Option[] | null                               │
│   conversationId: string | null                                 │
│ Actions:                                                        │
│   addMessage, setTyping, setOptions, clearChat                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ItineraryStore                                                  │
│ Purpose: Itinerary data and editing state                       │
│ Persisted: None (loaded fresh each visit)                       │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   itinerary: Itinerary | null                                   │
│   selectedEventIds: string[]                                    │
│   editMode: boolean                                             │
│   editSidebarOpen: boolean                                      │
│   undoStack: Itinerary[]                                        │
│   hasUnsavedChanges: boolean                                    │
│   warnings: DayWarning[]                                        │
│   eventConflicts: EventConflictMap                              │
│   visualSelections: Record<string, string>                      │
│ Actions:                                                        │
│   setItinerary, moveEvent, addEvent, deleteEvent,              │
│   addAlternative, promoteAlternative, cycleAlternative,        │
│   pushUndo, undo, applyChanges, setWarnings, setEventConflict  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CalendarStore                                                   │
│ Purpose: Google Calendar export modal state                     │
│ Persisted: None                                                 │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   isModalOpen: boolean                                          │
│   exportMode: 'block' | 'detailed'                              │
│   selectedCalendarId: string | null                              │
│   calendars: CalendarInfo[]                                     │
│   exportStatus: idle | fetching_calendars | exporting | ...     │
│   errorMessage: string | null                                   │
│   exportedEventCount: number                                    │
│ Actions:                                                        │
│   openModal, closeModal, setExportMode, setSelectedCalendar,   │
│   setCalendars, setExportStatus, setExportedEventCount, reset  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DebugStore                                                      │
│ Purpose: Development debugging logs                             │
│ Persisted: Optional (localStorage)                              │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   logs: LogEntry[]                                              │
│   isPanelOpen: boolean                                          │
│   persistToStorage: boolean                                     │
│ Actions:                                                        │
│   log, clearLogs, togglePanel, setPersistToStorage             │
└─────────────────────────────────────────────────────────────────┘
```

### Usage Patterns

```typescript
// Import stores
import { useTripStore, useClarificationStore, useItineraryStore } from '@/store';

// Select specific state (recommended - minimizes re-renders)
const tripData = useTripStore(state => state.tripData);
const setPhase = useTripStore(state => state.setPhase);

// Or destructure multiple values
const { questions, answers, setAnswer } = useClarificationStore();

// Actions can be called directly
setPhase('planning');
setAnswer('budget', 'moderate');
```

### Persistence Configuration

```typescript
// Only persist what's needed across sessions
persist(storeFunction, {
  name: 'storage-key',
  partialize: (state) => ({
    // Only these fields are persisted
    userProfile: state.userProfile,
  }),
});
```

---

## API Integration

### Real Backend (Clarification Phase)

**Location:** `src/lib/api/clarification.ts`

```typescript
// Start a new clarification session
startClarificationSession(request: StartSessionRequest): Promise<StartSessionResponse>

// Submit answers and get next questions
submitClarificationResponses(request: RespondRequest): Promise<RespondResponse>

// Check session status
checkSessionStatus(sessionId: string): Promise<SessionStatusResponse>

// Cancel session
cancelSession(sessionId: string): Promise<void>
```

**Backend endpoints:**
- `POST http://localhost:8000/api/clarification/start`
- `POST http://localhost:8000/api/clarification/respond`
- `GET http://localhost:8000/api/clarification/session/{id}`

### Google Calendar Export

**Location:** `src/app/api/calendar/`, `src/lib/calendar/`, `src/hooks/use-calendar-export.ts`

```typescript
// List user's Google Calendars (gracefully degrades to demo data)
GET /api/calendar/calendars

// Export events to Google Calendar (gracefully degrades to simulated success)
POST /api/calendar/export  { calendarId, events: GoogleCalendarEvent[] }
```

Uses NextAuth.js (`src/lib/auth.ts`) for Google OAuth with calendar scopes. Auth abstraction layer (`src/lib/calendar/auth-provider.ts`) allows swapping auth providers. Transformer (`src/lib/calendar/transformer.ts`) converts itinerary data to Google Calendar event format.

### Mock Backend (Planning Phase)

**Location:** `src/app/api/mock/`

| Route | Purpose |
|-------|---------|
| `/api/mock/chat` | Returns day options |
| `/api/mock/generate-day` | Generate specific day |
| `/api/mock/validate-edit` | Validate edits, return conflicts |

### API Error Handling

```typescript
// Base error class
class ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

// Domain-specific error
class ClarificationApiError extends ApiError {
  // Specialized handling for clarification errors
}

// Usage
try {
  const response = await startClarificationSession(request);
} catch (error) {
  if (error instanceof ClarificationApiError) {
    // Handle clarification-specific error
  }
}
```

### Constants

**Location:** `src/lib/constants.ts`

```typescript
export const API_ENDPOINTS = {
  // Mock endpoints (Next.js API routes)
  chat: '/api/mock/chat',
  generateDay: '/api/mock/generate-day',
  validateEdit: '/api/mock/validate-edit',

  // Real backend endpoints
  clarificationStart: 'http://localhost:8000/api/clarification/start',
  clarificationRespond: 'http://localhost:8000/api/clarification/respond',
};

export const PLANNING_PHASES = ['input', 'clarification', 'research', 'planning', 'review'];
export const BUDGET_CATEGORIES = ['budget', 'moderate', 'luxury'];
export const TRIP_FOCUS_OPTIONS = ['hiking', 'adventure', 'cultural', 'relaxation'];
```

---

## Type System

### Core Type Files

| File | Purpose |
|------|---------|
| `types/trip.ts` | Trip configuration and user profile |
| `types/itinerary.ts` | Itinerary, days, events, conflicts |
| `types/chat.ts` | Chat messages and day options |
| `types/clarification.ts` | Backend API contract |
| `types/api.ts` | Request/response interfaces |

### Key Type Hierarchies

```typescript
// Trip Data
interface TripData {
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: 'budget' | 'moderate' | 'luxury';
  focus: string[];
}

interface UserProfile {
  user_name: string;
  citizenship: string;
  health_limitations: string[];
  dietary_restrictions: string[];
  // ... more fields
}

type PlanningPhase = 'input' | 'clarification' | 'research' | 'planning' | 'review' | 'editing';

// Itinerary Structure
interface Itinerary {
  id: string;
  tripData: TripData;
  days: Day[];
  metadata: {
    total_cost: number;
    locked: boolean;
  };
}

interface Day {
  dayNumber: number;
  date: string;
  events: Event[];
  summary: {
    total_cost: number;
    energy_level: 'low' | 'medium' | 'high';
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'logistics' | 'activity' | 'dining' | 'transit' | 'rest';
  cost: number;
  alternativeGroupId?: string;  // For cycling between alternatives
  isPrimaryAlternative?: boolean;
}

// Clarification
interface Question {
  type: 'single_select' | 'multi_select' | 'ranked' | 'text';
  field: string;
  question: string;
  options?: string[];
  tier: number;
}

interface ClarificationData {
  user_profile: UserProfile;
  trip_basics: TripBasics;
  travel_style: TravelStyle;
  // ... more categories
}
```

### Imports

```typescript
// Import all types
import type { TripData, UserProfile, Itinerary, Day, Event } from '@/types';

// Or specific files
import type { Question, ClarificationData } from '@/types/clarification';
```

---

## Key Patterns

### 1. Compound Component Pattern

Used for complex, composable components (see EventCard):

```typescript
// Provider exposes context to children
<EventCard.Provider event={event}>
  // Children can use context without prop drilling
  <EventCard.Root>
    <EventCard.Content />
    <EventCard.Actions />
  </EventCard.Root>
</EventCard.Provider>
```

### 2. Barrel Exports

Each feature folder exports via `index.ts`:

```typescript
// components/clarification/index.ts
export { QuestionCard } from './QuestionCard';
export { CompletenessProgress } from './CompletenessProgress';
// ...

// Usage - clean imports
import { QuestionCard, CompletenessProgress } from '@/components/clarification';
```

### 3. Context + Zustand

- **Zustand** for global state (persisted, shared across pages)
- **Context** for component-tree-local state (avoids prop drilling)

```typescript
// Zustand: global state
const itinerary = useItineraryStore(state => state.itinerary);

// Context: local to component tree
<ItineraryProvider value={...}>
  <ComponentTree /> {/* Uses useItinerary() hook */}
</ItineraryProvider>
```

### 4. Custom Hooks for Logic

Separate business logic from UI:

```typescript
// Hook handles all complexity
const {
  isValidating,
  pendingConflicts,
  handleMoveEvent,
  handleApplyChanges,
  handleUndo,
} = useItineraryEdit();

// Component just renders
return <Button onClick={handleApplyChanges}>Save</Button>;
```

### 5. Event Type Registry

Extensible configuration for event types:

```typescript
// config/event-types.ts
export const EVENT_TYPE_REGISTRY = {
  logistics: { icon: Briefcase, colorClass: 'bg-slate-100...' },
  activity: { icon: Activity, colorClass: 'bg-emerald-50...' },
  dining: { icon: Utensils, colorClass: 'bg-amber-50...' },
  transit: { icon: Car, colorClass: 'bg-blue-50...' },
  rest: { icon: Bed, colorClass: 'bg-purple-50...' },
};

// Usage
const config = getEventTypeConfig(event.type);
const Icon = getEventTypeIcon(event.type);
```

---

## Development Workflow

### Adding a New Component

1. Create component file in appropriate directory
2. Export from `index.ts` barrel file
3. Use existing UI components from `components/ui/`
4. Follow single-responsibility principle

```typescript
// components/feature/NewComponent.tsx
export function NewComponent({ prop }: Props) {
  return <div>...</div>;
}

// components/feature/index.ts
export { NewComponent } from './NewComponent';
```

### Adding State

1. Decide: global (Zustand) or local (Context/useState)
2. For Zustand: add to existing store or create new
3. Use selective subscriptions to minimize re-renders

```typescript
// Add to existing store
// store/trip-store.ts
interface TripStore {
  newField: string;
  setNewField: (value: string) => void;
}

const useTripStore = create<TripStore>()((set) => ({
  newField: '',
  setNewField: (value) => set({ newField: value }),
}));
```

### Adding API Endpoints

**Mock endpoint:**
```typescript
// app/api/mock/new-endpoint/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // Simulate delay
  await new Promise(r => setTimeout(r, 1000));
  return Response.json({ success: true });
}
```

**Real backend integration:**
```typescript
// lib/api/new-feature.ts
export async function newApiCall(data: RequestType): Promise<ResponseType> {
  const response = await fetch(API_ENDPOINTS.newEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError('Request failed', response.status);
  }

  return response.json();
}
```

### Debugging

1. Open `DebugPanel` component (toggle in UI)
2. Logs show all state changes
3. Optional localStorage persistence
4. React DevTools for component inspection

---

## Common Tasks

### Where to Edit for...

| Task | File(s) |
|------|---------|
| Change form fields | `components/planning/InitialInputForm.tsx` |
| Add question type | `components/clarification/QuestionCard.tsx` |
| Modify event styling | `config/event-types.ts` |
| Add drag-drop behavior | `hooks/use-itinerary-edit.ts` |
| Change validation rules | `app/api/mock/validate-edit/route.ts` |
| Add new page | Create `app/new-route/page.tsx` |
| Modify state logic | Relevant store in `store/` |
| Add API integration | `lib/api/` |
| Modify calendar export | `hooks/use-calendar-export.ts`, `lib/calendar/transformer.ts` |
| Change calendar auth | `lib/calendar/auth-provider.ts`, `lib/calendar/auth/` |

### Import Shortcuts

```typescript
// Stores
import { useTripStore, useClarificationStore, useItineraryStore, useCalendarStore } from '@/store';

// Hooks
import { usePlanningWizard, useItineraryEdit, useEventAlternatives, useCalendarExport } from '@/hooks';

// Components
import { Hero, CTASection } from '@/components/landing';
import { InitialInputForm, ChatWindow } from '@/components/planning';
import { QuestionCard, ClarificationSummary } from '@/components/clarification';
import { TimelineView, EventCard, DayCard } from '@/components/itinerary';
import { CalendarExportModal } from '@/components/calendar';

// Types
import type { TripData, Itinerary, Event, Question } from '@/types';

// API
import { startClarificationSession, submitClarificationResponses } from '@/lib/api';

// Context
import { ItineraryProvider, useItinerary } from '@/contexts';

// Config
import { getEventTypeConfig, getEventTypeIcon } from '@/config';
```

---

## File Reference

### By File Count

| Directory | Files | Purpose |
|-----------|-------|---------|
| `components/` | 67+ | All React components |
| `hooks/` | 9 | Custom React hooks |
| `app/` | 12 | Pages + API routes |
| `store/` | 7 | Zustand stores |
| `types/` | 7 | TypeScript interfaces |
| `lib/api/` | 4 | Backend communication |
| `lib/calendar/` | 4 | Google Calendar integration |
| `lib/mock-data/` | 6 | Simulated responses |
| `config/` | 2 | App configuration |
| `contexts/` | 2 | React Context |
| **Total** | **~120** | **Full source** |

### Key Files Quick Reference

```
Most important files to understand:

State Management:
  src/store/trip-store.ts           # Trip metadata
  src/store/clarification-store.ts  # Clarification session
  src/store/itinerary-store.ts      # Itinerary editing

Core Hooks:
  src/hooks/use-planning-wizard.ts  # Wizard orchestration
  src/hooks/use-itinerary-edit.ts   # Edit operations

Main Pages:
  src/app/plan/page.tsx             # Input + Clarification (steps 1-2)
  src/app/research/page.tsx         # Research loading (step 3)
  src/app/select/page.tsx           # Day selection + Review (steps 4-5)
  src/app/itinerary/[id]/page.tsx   # Itinerary editor

API:
  src/lib/api/clarification.ts      # Backend calls
  src/lib/constants.ts              # Endpoints, config

Types:
  src/types/itinerary.ts            # Itinerary structure
  src/types/clarification.ts        # Backend API contract
```

---

## Design System

### Color Scheme

| Purpose | Color |
|---------|-------|
| Primary | `blue-600` |
| Secondary | `emerald-500` |
| Accent | `amber-500` |
| Neutral | `slate` |

### Breakpoints

| Size | Width | Layout |
|------|-------|--------|
| Mobile | < 768px | Stacked |
| Tablet | 768-1024px | 50/50 split |
| Desktop | > 1024px | 40/60 split |

### Path Alias

```typescript
// tsconfig.json configures @/* -> ./src/*
import { Component } from '@/components/feature';  // Clean imports
```

---

## Conclusion

This codebase follows modern React patterns with clear separation of concerns:

- **Pages** handle routing and high-level composition
- **Components** handle UI rendering
- **Hooks** handle business logic
- **Stores** handle global state
- **API layer** handles backend communication

The compound component pattern (EventCard) and barrel exports make the codebase modular and maintainable. When in doubt, follow existing patterns in similar files.

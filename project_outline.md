# Trip Planner AI - Detailed MVP Project Specification

## Project Overview

Build an MVP web application that provides an AI-powered, interactive trip planning experience. The app guides users through day-by-day itinerary creation with a conversational agent interface, then presents the final itinerary in a clean, drag-drop editable format. This MVP focuses on the frontend experience with simulated AI responses.

**Core Problem Being Solved:**
- Replace messy Google Docs/Sheets trip planning
- AI that understands user preferences through conversation
- Automatic conflict detection when editing one day affects others
- Single source of truth for entire trip

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components (for consistent, beautiful UI)
- React DnD or dnd-kit (for drag-drop functionality)
- Zustand (lightweight state management)
- React Query (for API calls, even though mocked)

**Backend (Future - Simulated for Now):**
- Python FastAPI
- LangGraph for agent orchestration
- Mock responses in frontend for MVP

## MVP Core Features

### 1. Initial Input Form
- Simple, clean form for basic trip details
- Fields: destination, dates, rough budget, trip focus
- Conversational tone, not intimidating

### 2. Interactive Planning Chat Interface
- Split-screen: chat on left, itinerary preview on right
- Agent asks clarifying questions
- Agent presents 3 options per day
- User picks options through chat or click
- Real-time itinerary updates as days are locked

### 3. Final Itinerary View
- Timeline view of entire trip
- Each day is a card with events listed
- Drag-drop events between days
- Drag-drop events within a day to reorder
- Click event to edit details
- Select multiple events to bulk edit via chat

### 4. Itinerary Edit Chat
- Chat sidebar that opens when editing
- User can select events and ask agent to modify
- "Make Day 3 lighter", "Move this to Day 5", etc.
- Agent simulates conflict detection and suggestions

## Detailed Component Breakdown

### Page Structure

```
/
├── page.tsx                 # Landing/home page with "Start Planning" CTA
├── plan/
│   └── page.tsx            # Main planning interface (split into steps)
├── itinerary/
│   └── [id]/
│       └── page.tsx        # Final itinerary view (drag-drop interface)
└── api/
    └── mock/
        ├── chat.ts         # Mock chat responses
        ├── generate.ts     # Mock itinerary generation
        └── validate.ts     # Mock validation responses
```

### Component Hierarchy

```
App
├── LandingPage
│   ├── Hero
│   ├── ProblemStatement
│   └── CTAButton
│
├── PlanningInterface (multi-step wizard)
│   ├── Step1: InitialInput
│   │   └── TripDetailsForm
│   │
│   ├── Step2: ClarificationChat
│   │   ├── ChatWindow
│   │   │   ├── MessageList
│   │   │   └── MessageInput
│   │   └── ProgressIndicator
│   │
│   └── Step3: DayByDayPlanning
│       ├── ChatWindow (left side)
│       │   ├── MessageList
│       │   ├── OptionCards (clickable 3 options)
│       │   └── MessageInput
│       └── ItineraryPreview (right side)
│           └── DayCardsList (read-only preview)
│
└── ItineraryView
    ├── Header
    │   ├── TripMetadata (destination, dates, budget)
    │   └── ActionButtons (export, share)
    │
    ├── TimelineView (main area)
    │   └── DayCards (draggable container)
    │       └── DayCard (for each day)
    │           ├── DayHeader (date, summary)
    │           └── EventsList (draggable events)
    │               └── EventCard (draggable item)
    │                   ├── EventTime
    │                   ├── EventTitle
    │                   ├── EventLocation
    │                   ├── EventCost
    │                   └── EventActions (edit, delete)
    │
    └── EditChatSidebar (toggleable)
        ├── ChatMessages
        ├── SelectedEventsPreview
        └── ChatInput
```

## Data Structures

### TripData
```typescript
interface TripData {
  id: string;
  destination: string;
  startDate: string; // ISO format
  endDate: string;
  budget: number;
  currency: string;
  focus: string; // "hiking", "cultural", "mixed", etc.
  travelers: number;
  createdAt: string;
  updatedAt: string;
}
```

### UserProfile
```typescript
interface UserProfile {
  departure_city?: string;
  hiking_level?: "beginner" | "intermediate" | "advanced";
  pace_preference?: "relaxed" | "moderate" | "packed";
  dietary_restrictions?: string[];
  interests?: string[];
}
```

### Itinerary
```typescript
interface Itinerary {
  trip_id: string;
  days: Day[];
  metadata: {
    total_cost: number;
    total_days: number;
    locked: boolean;
  };
}

interface Day {
  day_number: number;
  date: string;
  theme?: string; // "Arrival", "Hiking", "Cultural", etc.
  events: Event[];
  summary: {
    total_cost: number;
    active_hours: number;
    rest_hours: number;
    energy_level: "light" | "moderate" | "strenuous";
  };
  locked: boolean;
}

interface Event {
  id: string;
  order: number;
  time_start: string; // "14:00"
  time_end: string;
  duration_minutes: number;
  type: "logistics" | "activity" | "dining" | "transit" | "rest";
  category: string;
  title: string;
  description: string;
  location?: {
    name: string;
    address: string;
    coordinates: [number, number];
    google_place_id?: string;
  };
  cost?: {
    amount: number;
    currency: string;
    category: string;
  };
  metadata: {
    booking_required: boolean;
    confirmation_number?: string;
    notes?: string;
    weather_dependent: boolean;
  };
  alternatives?: Alternative[];
}

interface Alternative {
  title: string;
  reason_not_chosen: string;
  would_save_cost?: number;
  would_save_time?: number;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  type?: "question" | "options" | "confirmation" | "info";
  options?: Option[]; // For option cards
  metadata?: {
    day_number?: number;
    event_ids?: string[];
  };
}

interface Option {
  id: string;
  title: string;
  description: string;
  cost: number;
  energy_level: string;
  highlights: string[];
  events_preview: Event[];
}
```

## API Contract (Mocked)

### POST /api/mock/chat
Request:
```json
{
  "message": "From Singapore, advanced hiker, 80% hiking 20% culture",
  "conversation_id": "conv_123",
  "context": {
    "trip_data": {...},
    "current_phase": "clarification" | "day_planning" | "editing"
  }
}
```

Response:
```json
{
  "message": "Great! Now I can start planning...",
  "type": "info" | "question" | "options" | "confirmation",
  "options": [...], // if type === "options"
  "next_phase": "day_planning",
  "updated_state": {...}
}
```

### POST /api/mock/generate-day
Request:
```json
{
  "trip_id": "trip_123",
  "day_number": 1,
  "user_profile": {...},
  "research_context": {...}
}
```

Response:
```json
{
  "day_number": 1,
  "options": [
    {
      "id": "opt_1",
      "title": "Light Exploration",
      "events": [...]
    },
    {
      "id": "opt_2",
      "title": "Rest & Acclimate",
      "events": [...]
    },
    {
      "id": "opt_3",
      "title": "Gear Prep",
      "events": [...]
    }
  ]
}
```

### POST /api/mock/validate-edit
Request:
```json
{
  "itinerary": {...},
  "edit_action": {
    "type": "move" | "delete" | "add" | "reorder",
    "event_id": "evt_001",
    "from_day": 3,
    "to_day": 5
  }
}
```

Response:
```json
{
  "valid": false,
  "conflicts": [
    {
      "day": 5,
      "issue": "Too many activities",
      "severity": "medium"
    }
  ],
  "suggestions": [
    {
      "id": "sug_1",
      "description": "Remove shopping activity from Day 5",
      "impact": "Saves 2 hours"
    }
  ],
  "updated_itinerary": {...}
}
```

## File Structure

```
trip-planner-mvp/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page
│   │   ├── layout.tsx                    # Root layout
│   │   ├── globals.css                   # Global styles
│   │   ├── plan/
│   │   │   └── page.tsx                  # Planning interface
│   │   ├── itinerary/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Itinerary view
│   │   └── api/
│   │       └── mock/
│   │           ├── chat/
│   │           │   └── route.ts          # Mock chat endpoint
│   │           ├── generate-day/
│   │           │   └── route.ts          # Mock day generation
│   │           └── validate-edit/
│   │               └── route.ts          # Mock validation
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── ProblemStatement.tsx
│   │   │   └── CTASection.tsx
│   │   │
│   │   ├── planning/
│   │   │   ├── InitialInputForm.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── OptionCard.tsx
│   │   │   ├── ItineraryPreview.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   └── itinerary/
│   │       ├── ItineraryHeader.tsx
│   │       ├── DayCard.tsx
│   │       ├── EventCard.tsx
│   │       ├── TimelineView.tsx
│   │       ├── EditChatSidebar.tsx
│   │       └── DragDropContext.tsx
│   │
│   ├── lib/
│   │   ├── mock-data/
│   │   │   ├── sample-trips.ts           # Sample trip data
│   │   │   ├── mock-responses.ts         # Canned agent responses
│   │   │   └── mock-itineraries.ts       # Pre-built itineraries
│   │   │
│   │   ├── api-client.ts                 # API client wrapper
│   │   ├── utils.ts                      # Helper functions
│   │   └── constants.ts                  # App constants
│   │
│   ├── hooks/
│   │   ├── use-chat.ts                   # Chat logic hook
│   │   ├── use-itinerary.ts              # Itinerary state hook
│   │   └── use-drag-drop.ts              # Drag-drop logic
│   │
│   ├── store/
│   │   ├── trip-store.ts                 # Zustand store for trip data
│   │   ├── chat-store.ts                 # Zustand store for chat
│   │   └── itinerary-store.ts            # Zustand store for itinerary
│   │
│   └── types/
│       ├── trip.ts                       # Trip-related types
│       ├── itinerary.ts                  # Itinerary types
│       ├── chat.ts                       # Chat types
│       └── api.ts                        # API types
│
├── public/
│   ├── images/
│   └── icons/
│
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

## UI/UX Specifications

### Design Principles
1. **Clean and minimal** - Don't overwhelm with options
2. **Conversational** - Feel like chatting with a smart friend
3. **Progressive disclosure** - Show info as needed, not all at once
4. **Visual feedback** - Clear indicators for loading, success, errors
5. **Mobile-responsive** - Should work on tablet/mobile too

### Color Scheme (Tailwind)
```javascript
// Use a calm, travel-inspired palette
primary: blue-600        // Trust, sky, water
secondary: emerald-500   // Nature, growth
accent: amber-500        // Warmth, sun
neutral: slate           // Modern, clean
error: red-500
success: green-500
```

### Key UI Patterns

**Landing Page:**
- Hero with large headline: "Plan Your Trip in Minutes, Not Hours"
- 3-column problem statement (messy docs, no personalization, hard to edit)
- Large CTA button: "Start Planning"
- Clean, professional, not cluttered

**Planning Interface:**
- Progress bar at top showing: "Input → Clarification → Day Planning → Review"
- Chat on left (40% width), preview on right (60% width) for Steps 2-3
- Option cards should be clickable with hover effects
- Clear "Lock Day" confirmation before moving to next day

**Itinerary View:**
- Sidebar with trip metadata (destination, dates, budget used/remaining)
- Main area: scrollable timeline of days
- Each day card has header with: date, theme, cost, energy level
- Events within day have time markers on left, content on right
- Drag handles visible on hover
- Visual connection lines between events showing time flow
- Mini-map on right showing all days (optional for MVP)

**Drag-Drop Behavior:**
- Smooth animations when dragging
- Drop zones highlight when hovering
- Snap to position when dropped
- Show time adjustments in real-time
- Undo button appears after any drag action

**Edit Chat Sidebar:**
- Slides in from right (30% width)
- Selected events highlighted in blue in timeline
- Chat messages reference selected events
- "Apply Changes" button at bottom
- Can close sidebar without applying

## Step-by-Step User Flow

### Flow 1: Initial Planning

1. **User lands on homepage**
   - Sees hero, problem statement, CTA
   - Clicks "Start Planning"

2. **Initial Input Form (Step 1)**
   - Form appears with fields:
     - Where? (destination input with autocomplete)
     - When? (date range picker)
     - Budget? (number input with currency selector)
     - What's your focus? (select: Adventure, Cultural, Relaxation, Mixed)
   - User fills out, clicks "Next"

3. **Clarification Chat (Step 2)**
   - Progress bar shows "Step 2 of 4"
   - Agent message: "Great! I have a few questions to personalize your trip..."
   - Agent asks 3-4 questions one by one:
     - "Where will you fly from?"
     - "What's your hiking experience level?"
     - "Do you prefer packed days or relaxed pace?"
   - User types answers
   - Agent confirms: "Perfect! I have everything I need. Starting research..."
   - Loading animation (simulating research)
   - Transition to Step 3

4. **Day-by-Day Planning (Step 3)**
   - Split screen appears
   - Left: Chat continues
   - Right: Empty itinerary preview

   - **Day 1 Planning:**
     - Agent: "Day 1 (Dec 15): You arrive at 2pm. Here are 3 options:"
     - 3 option cards appear in chat
     - Each card shows: title, timeline, cost, energy level, highlights
     - User clicks one card OR types preference
     - Agent may ask follow-up: "Want a nice local restaurant for dinner?"
     - User responds
     - Agent confirms: "Day 1 locked ✓ [Shows summary] Moving to Day 2..."
     - Right side preview updates with Day 1 card

   - **Repeat for Day 2, 3, 4, 5**

   - After last day: "All days planned! Running final checks..."
   - Loading animation
   - Agent: "Found 2 small optimizations. Should I apply them?"
   - User: "Yes"
   - Agent: "Done! Your itinerary is ready. View full itinerary →"

5. **Transition to Itinerary View**
   - Button click navigates to `/itinerary/[trip_id]`
   - Smooth fade transition
   - Full itinerary displayed

### Flow 2: Editing Itinerary

1. **User on Itinerary View**
   - Sees full timeline with all 5 days
   - Wants to modify Day 3

2. **Drag-Drop Edit**
   - Hovers over event on Day 3
   - Drag handle appears
   - Drags event to Day 5
   - Drop zone on Day 5 highlights
   - Drops event
   - Modal appears: "This creates conflicts. Open edit chat?"
   - User clicks "Yes"

3. **Edit Chat Opens**
   - Sidebar slides in from right
   - Agent message: "I see you moved [event] to Day 5. This makes Day 5 quite packed. Should I: A) Remove lowest priority activity, B) Move something to Day 4, C) Keep it packed?"
   - User picks Option A
   - Agent: "Done! Removed [activity] from Day 5. Here's the updated Day 5:"
   - Shows updated Day 5 preview
   - User: "Perfect"
   - Agent: "Great! Anything else to adjust?"
   - User: "No, looks good"
   - Sidebar closes
   - Timeline updates with changes

## Mock Data Requirements

### Mock Responses Library

Create canned responses for common scenarios:

**Clarification Phase:**
- Response to fitness level question
- Response to pace preference
- Response to budget concerns
- Confirmation message before research

**Day Planning Phase:**
- 3 option sets for arrival day (light, rest, prep)
- 3 option sets for full hiking day
- 3 option sets for cultural mix day
- 3 option sets for departure day
- Follow-up questions for refinements
- Day confirmation messages

**Editing Phase:**
- Conflict detection messages
- Suggested resolutions
- Confirmation messages
- Optimization suggestions

### Sample Itinerary

Create 1-2 complete sample itineraries with:
- 5 days of events
- Mix of activity types
- Realistic timing and costs
- Alternatives stored
- Good variety to test drag-drop

## State Management Strategy

### Global State (Zustand)

**Trip Store:**
```typescript
interface TripStore {
  tripData: TripData | null;
  userProfile: UserProfile;
  currentPhase: "input" | "clarification" | "planning" | "review" | "editing";
  setTripData: (data: TripData) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setPhase: (phase: string) => void;
}
```

**Chat Store:**
```typescript
interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  currentOptions: Option[] | null;
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  setOptions: (options: Option[]) => void;
  clearChat: () => void;
}
```

**Itinerary Store:**
```typescript
interface ItineraryStore {
  itinerary: Itinerary | null;
  selectedEvents: string[];
  editMode: boolean;
  setItinerary: (itinerary: Itinerary) => void;
  updateDay: (dayNumber: number, day: Day) => void;
  moveEvent: (eventId: string, fromDay: number, toDay: number) => void;
  selectEvent: (eventId: string) => void;
  deselectEvent: (eventId: string) => void;
  toggleEditMode: () => void;
}
```

## Key Implementation Details

### Mock Chat Logic
Create a simple state machine in the mock API:

```typescript
// In /api/mock/chat/route.ts
const chatStateMachine = {
  "initial": {
    response: "Great! I have a few questions...",
    next: "ask_departure"
  },
  "ask_departure": {
    response: "Where will you fly from?",
    next: "ask_experience"
  },
  "ask_experience": {
    response: "What's your hiking experience?",
    next: "ask_pace"
  },
  // ... etc
};
```

### Drag-Drop Implementation
Use `@dnd-kit/core` for better touch support:

```typescript
// Key handlers
function handleDragStart(event) {
  setActiveId(event.active.id);
}

function handleDragEnd(event) {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    // Determine if moving between days or within day
    const fromDay = findDayByEventId(active.id);
    const toDay = findDayByContainerId(over.id);

    // Call store action
    itineraryStore.moveEvent(active.id, fromDay, toDay);

    // Trigger validation
    validateEdit({ eventId: active.id, fromDay, toDay });
  }
}
```

### Responsive Design Breakpoints

```css
/* Mobile: < 768px */
- Stack chat and preview vertically
- Full-width components
- Simplified drag-drop (click to move instead)

/* Tablet: 768px - 1024px */
- Side-by-side chat and preview (50/50)
- Smaller event cards

/* Desktop: > 1024px */
- Optimal layout (40/60 split)
- Full features
```

## Development Phases

### Phase 1: Foundation (Do First)
1. Set up Next.js project with TypeScript
2. Install and configure Tailwind + shadcn/ui
3. Create basic routing structure
4. Set up Zustand stores
5. Create type definitions
6. Build landing page

### Phase 2: Planning Interface
1. Build InitialInputForm component
2. Create ChatWindow component
3. Implement mock chat API
4. Build OptionCard components
5. Create ItineraryPreview component
6. Connect chat flow to stores
7. Add step progress indicator

### Phase 3: Itinerary View
1. Build DayCard component
2. Build EventCard component
3. Create TimelineView layout
4. Implement drag-drop with dnd-kit
5. Add visual feedback for dragging
6. Create EditChatSidebar

### Phase 4: Polish
1. Add loading states and animations
2. Implement error handling
3. Add undo/redo for drag actions
4. Mobile responsive adjustments
5. Add export functionality (JSON download)
6. Testing and bug fixes

## Success Criteria

MVP is complete when:
1. ✅ User can input trip details
2. ✅ User can complete clarification chat
3. ✅ User can plan all 5 days with options
4. ✅ User can see complete itinerary
5. ✅ User can drag-drop events between days
6. ✅ User can edit via chat sidebar
7. ✅ Mock responses feel realistic
8. ✅ UI is clean and professional
9. ✅ Mobile responsive (basic)
10. ✅ No critical bugs

## Future Backend Integration Points

When ready to connect real backend:

1. Replace mock API routes with real FastAPI endpoints
2. Add authentication (NextAuth.js)
3. Add database persistence (trip storage)
4. Real-time WebSocket for chat streaming
5. Add LangGraph agent integration
6. Add actual web search for research phase
7. Add user account and trip history
8. Add collaborative features (sharing trips)

---

## Getting Started Command

For Claude Code:

"Build me a Next.js 14 MVP for an AI trip planning app. Use TypeScript, Tailwind CSS, and shadcn/ui. The app has 3 main pages: (1) Landing page with hero and CTA, (2) Planning interface with a chat-based day-by-day trip planner using mock AI responses, (3) Drag-drop itinerary editor where users can rearrange events and get AI suggestions for conflicts. Use Zustand for state management. Follow the detailed component structure and data models in the attached specification. Focus on clean, modular code that's easy to extend. Start with the project foundation, then build the planning interface, then the itinerary view."

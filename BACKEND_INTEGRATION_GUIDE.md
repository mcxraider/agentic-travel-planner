# Backend Integration Guide

This guide explains how the frontend mock system works and how to build a real backend with LLM integration to replace it.

---

## Table of Contents

1. [Overview](#overview)
2. [API Contracts](#api-contracts)
3. [Data Types Reference](#data-types-reference)
4. [Planning Flow State Machine](#planning-flow-state-machine)
5. [LLM Integration Points](#llm-integration-points)
6. [Prompt Engineering Guidelines](#prompt-engineering-guidelines)
7. [Validation System](#validation-system)
8. [Migration Checklist](#migration-checklist)

---

## Overview

The frontend currently uses mock API routes in `src/app/api/mock/` that simulate AI responses. Your backend needs to implement three main endpoints:

| Endpoint | Purpose | Location |
|----------|---------|----------|
| `POST /api/chat` | Main conversational interface | `src/app/api/mock/chat/route.ts` |
| `POST /api/generate-day` | Day option generation | `src/app/api/mock/generate-day/route.ts` |
| `POST /api/validate-edit` | Itinerary conflict detection | `src/app/api/mock/validate-edit/route.ts` |

The frontend calls these endpoints and expects specific response formats. Your backend LLM system must return responses that match these contracts exactly.

---

## API Contracts

### 1. Chat Endpoint

**Endpoint**: `POST /api/chat`

This is the main conversational endpoint used throughout the planning flow.

#### Request Body

```typescript
interface ChatRequestBody {
  message: string;              // User's message text
  conversation_id: string;      // Unique conversation identifier
  context: {
    current_phase: 'clarification' | 'planning' | 'editing';
    clarification_step?: number;  // 0-indexed question number
    current_day?: number;         // Which day being planned (1-indexed)
    total_days?: number;          // Total trip duration
    trip_data?: {
      destination?: string;
      startDate?: string;
      // Full TripData object available
    };
  };
}
```

#### Response Body

```typescript
interface ChatResponse {
  message: string;              // AI's response text
  type: 'info' | 'question' | 'options' | 'confirmation';
  options?: Option[];           // Day options (only for planning phase)
  next_phase?: PlanningPhase;   // Signal phase transition
  updated_state?: Partial<{     // State updates from user answers
    trip_data: TripData;
    user_profile: UserProfile;
  }>;
}
```

#### Phase-Specific Behavior

**Clarification Phase** (`current_phase: 'clarification'`):

The frontend sends clarification step numbers (0, 1, 2...). Your backend should:

1. Return appropriate follow-up to the user's answer
2. Ask the next clarification question
3. When all questions answered, include `next_phase: 'planning'`

Example request:
```json
{
  "message": "San Francisco",
  "conversation_id": "abc-123",
  "context": {
    "current_phase": "clarification",
    "clarification_step": 0,
    "trip_data": {
      "destination": "Tokyo",
      "startDate": "2024-03-15"
    }
  }
}
```

Example response:
```json
{
  "message": "Got it! San Francisco is a great starting point with direct flights to Tokyo. Now, what's your experience level with hiking and outdoor activities?",
  "type": "question",
  "updated_state": {
    "user_profile": {
      "departure_city": "San Francisco"
    }
  }
}
```

**Planning Phase** (`current_phase: 'planning'`):

When the frontend requests day options:

```json
{
  "message": "get day plans",
  "conversation_id": "abc-123",
  "context": {
    "current_phase": "planning",
    "current_day": 1,
    "total_days": 5,
    "trip_data": { ... }
  }
}
```

Your backend should return 3 day options:

```json
{
  "message": "Let's plan Day 1! Here are three options for your arrival day:",
  "type": "options",
  "options": [
    {
      "id": "day1-opt1",
      "title": "Light Exploration",
      "description": "Ease into your trip with a gentle afternoon exploring the neighborhood",
      "cost": 50,
      "energy_level": "light",
      "highlights": ["Local cafe visit", "Evening stroll", "Traditional dinner"],
      "events_preview": [
        {
          "id": "evt-1",
          "order": 1,
          "time_start": "14:00",
          "time_end": "15:00",
          "duration_minutes": 60,
          "type": "logistics",
          "category": "accommodation",
          "title": "Check into hotel",
          "description": "Settle into your accommodation",
          "metadata": {}
        }
        // ... more events
      ]
    }
    // ... 2 more options
  ]
}
```

When the user selects an option (message matches `/^[123]$/` or contains "option", "choose", "select"):

```json
{
  "message": "Great choice! I've locked in the Light Exploration plan for Day 1.",
  "type": "confirmation"
}
```

**Editing Phase** (`current_phase: 'editing'`):

Handle optimization suggestions and conflict resolution:

```json
{
  "message": "I've noticed some potential optimizations. Would you like me to apply them?",
  "type": "question"
}
```

---

### 2. Generate Day Endpoint

**Endpoint**: `POST /api/generate-day`

Currently a placeholder. This endpoint can be used for on-demand day regeneration.

#### Request Body

```typescript
interface GenerateDayRequest {
  day_number: number;
  trip_data: TripData;
  user_profile: UserProfile;
  existing_days?: Day[];        // Previous days for context
  preferences?: {
    energy_level?: 'light' | 'moderate' | 'strenuous';
    focus?: string[];
  };
}
```

#### Response Body

```typescript
interface GenerateDayResponse {
  options: Option[];            // Array of 3 day options
  message?: string;             // Optional intro message
}
```

---

### 3. Validate Edit Endpoint

**Endpoint**: `POST /api/validate-edit`

Validates itinerary changes for conflicts and suggests optimizations.

#### Request Body

```typescript
interface ValidateEditRequest {
  itinerary: Itinerary;
  changed_event_id?: string;    // Which event was modified
  change_type?: 'move' | 'delete' | 'add' | 'update';
}
```

#### Response Body

```typescript
interface ValidationResult {
  valid: boolean;
  conflicts: Conflict[];
  optimizations: Optimization[];
}

interface Conflict {
  id: string;
  type: 'time_overlap' | 'too_many_activities' | 'high_energy_consecutive';
  severity: 'warning' | 'error';
  dayNumber: number;
  eventIds: string[];
  message: string;
  suggestion?: {
    action: 'move' | 'remove' | 'make_alternative' | 'reschedule';
    description: string;
    target_event_id: string;
    new_day?: number;
    new_time?: string;
  };
}

interface Optimization {
  id: string;
  type: 'reorder' | 'timing' | 'cost_saving';
  dayNumber: number;
  message: string;
  impact: string;
  suggestion: {
    action: 'reorder' | 'adjust_time';
    event_ids: string[];
    new_order?: number[];
    new_times?: { event_id: string; time_start: string; time_end: string }[];
  };
}
```

---

## Data Types Reference

### Core Types

Located in `src/types/`. Your backend responses must match these exactly.

#### TripData

```typescript
interface TripData {
  id: string;
  destination: string;
  destinations: string[];       // Multi-city support
  startDate: string;            // ISO format "2024-03-15"
  endDate: string;
  budgetCategory: 'budget' | 'moderate' | 'luxury';
  focus: ('hiking' | 'adventure' | 'cultural' | 'relaxation')[];
  travelers: number;
  canDrive: boolean;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### UserProfile

```typescript
interface UserProfile {
  departure_city?: string;
  hiking_level?: 'beginner' | 'intermediate' | 'advanced';
  pace_preference?: 'relaxed' | 'moderate' | 'packed';
  dietary_restrictions?: string[];
  interests?: string[];
}
```

#### Event

```typescript
interface Event {
  id: string;                   // Unique identifier
  order: number;                // Position in day (1-indexed)
  time_start: string;           // "14:00" format
  time_end: string;
  duration_minutes: number;
  type: 'logistics' | 'activity' | 'dining' | 'transit' | 'rest';
  category: string;             // e.g., "accommodation", "hiking", "restaurant"
  title: string;
  description: string;
  location?: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    place_id?: string;
  };
  cost?: {
    amount: number;
    currency: string;
    per_person: boolean;
  };
  metadata: {
    booking_required?: boolean;
    booking_url?: string;
    tips?: string[];
    weather_dependent?: boolean;
    difficulty_level?: string;
  };
  alternativeGroupId?: string;  // For grouping alternatives
  isPrimaryAlternative?: boolean;
}
```

#### Option (Day Option)

```typescript
interface Option {
  id: string;
  title: string;                // e.g., "Adventure Day"
  description: string;          // 1-2 sentence summary
  cost: number;                 // Estimated total cost
  energy_level: 'light' | 'moderate' | 'strenuous';
  highlights: string[];         // 3-5 key highlights
  events_preview: Event[];      // Full event list for this option
}
```

#### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;            // ISO format
  type?: 'question' | 'options' | 'confirmation' | 'info';
  options?: Option[];           // Attached options if type='options'
  metadata?: {
    day_number?: number;
    event_ids?: string[];
  };
}
```

---

## Planning Flow State Machine

The frontend follows this exact flow. Your backend must support it:

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT PHASE                              │
│  User fills form → TripData created → Phase: 'clarification'    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLARIFICATION PHASE                           │
│                                                                  │
│  Step 0: "Where will you be flying from?"                       │
│     └─→ User: "San Francisco"                                   │
│     └─→ AI: Follow-up + "What's your experience level?"         │
│                                                                  │
│  Step 1: User: "Intermediate"                                   │
│     └─→ AI: Follow-up + "Packed days or relaxed pace?"          │
│                                                                  │
│  Step 2: User: "Relaxed"                                        │
│     └─→ AI: Follow-up + { next_phase: 'planning' }              │
│                                                                  │
│  Frontend shows "Researching..." for 10 seconds                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLANNING PHASE                              │
│                                                                  │
│  For each day (1 to N):                                         │
│                                                                  │
│  1. Frontend sends: { message: "get day plans", current_day: X }│
│                                                                  │
│  2. Backend returns:                                            │
│     - Day intro message                                         │
│     - 3 Option objects with events_preview                      │
│                                                                  │
│  3. User clicks option card                                     │
│                                                                  │
│  4. Frontend sends: { message: "1" } (or "2", "3")              │
│                                                                  │
│  5. Backend returns confirmation message                        │
│                                                                  │
│  6. Frontend creates Day object from selected option            │
│                                                                  │
│  Repeat until all days planned                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       REVIEW PHASE                               │
│                                                                  │
│  Frontend displays trip summary                                 │
│  User clicks "View Itinerary"                                   │
│  Itinerary object created and stored                            │
│  Route to /itinerary/[id]                                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDITING PHASE                               │
│                                                                  │
│  User drags/drops events                                        │
│  Frontend calls /api/validate-edit                              │
│  Backend returns conflicts/optimizations                        │
│  Frontend displays warnings                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## LLM Integration Points

### Where to Use LLM Calls

Your backend should use LLM for these specific tasks:

#### 1. Clarification Question Generation

**Current Mock**: Fixed questions in `CLARIFICATION_QUESTIONS` array.

**LLM Enhancement**: Generate contextual questions based on:
- Destination (Tokyo needs different questions than Paris)
- Trip focus (hiking trips need fitness questions)
- Trip duration (longer trips need pace questions)

**Suggested Prompt Template**:
```
You are a travel planning assistant. The user is planning a trip to {destination}
from {start_date} to {end_date} with focus on {focus_areas}.

Generate a follow-up question to learn more about their preferences.
Previous questions asked: {previous_questions}
User's trip details: {trip_data}

Return ONLY a single question, no preamble.
```

#### 2. Follow-up Response Generation

**Current Mock**: Fixed `followUp` strings per question.

**LLM Enhancement**: Generate natural follow-ups that acknowledge the user's answer:

**Suggested Prompt Template**:
```
The user answered "{user_answer}" to the question "{question}".
Generate a brief (1-2 sentence) acknowledgment that shows you understood their
preference and will factor it into the planning.

Do not ask another question. Just acknowledge.
```

#### 3. Day Option Generation

**Current Mock**: Pre-built options in `mock-day-options.ts`.

**LLM Enhancement**: This is the **most important** LLM integration point.

**Required Output Structure**:
```json
{
  "options": [
    {
      "id": "generated-uuid",
      "title": "Short title (3-5 words)",
      "description": "1-2 sentence overview",
      "cost": 150,
      "energy_level": "moderate",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "events_preview": [
        {
          "id": "event-uuid",
          "order": 1,
          "time_start": "09:00",
          "time_end": "11:00",
          "duration_minutes": 120,
          "type": "activity",
          "category": "hiking",
          "title": "Event title",
          "description": "Event description",
          "location": {
            "name": "Location name",
            "address": "Full address"
          },
          "cost": { "amount": 50, "currency": "USD", "per_person": true },
          "metadata": { "booking_required": false }
        }
      ]
    }
  ]
}
```

**Suggested Prompt Template**:
```
You are a travel planning AI. Generate 3 day options for Day {day_number} of a
{total_days}-day trip to {destination}.

User Profile:
- Departure city: {departure_city}
- Activity level: {hiking_level}
- Pace preference: {pace_preference}
- Budget: {budget_category}
- Focus areas: {focus}

Previous days planned: {previous_days_summary}

Day type: {day_type} (arrival/departure/full day)
Date: {date}

Generate 3 diverse options:
1. A lighter/easier option
2. A moderate/balanced option
3. An active/adventure option

Each option must include:
- 4-6 events with realistic times
- Events should flow logically (breakfast → activity → lunch → activity → dinner)
- Include transit time between locations
- Respect the user's pace preference
- Stay within budget category

Return ONLY valid JSON matching this schema: {schema}
```

#### 4. Day Introduction Message

**Current Mock**: Template strings in `getDayIntroMessage()`.

**LLM Enhancement**: Generate contextual intros:

```
Generate a 1-2 sentence introduction for Day {day_number} of planning.
Destination: {destination}
Date: {date}
Is arrival day: {is_arrival}
Is departure day: {is_departure}
Previous day theme: {previous_day_theme}

Be conversational and enthusiastic but concise.
```

#### 5. Conflict Detection Messages

**Current Mock**: Template messages in validation logic.

**LLM Enhancement**: Generate human-readable conflict explanations:

```
A conflict was detected:
- Type: {conflict_type}
- Events involved: {event_titles}
- Day: {day_number}

Generate a helpful message explaining the issue and suggesting a resolution.
Keep it under 2 sentences.
```

---

## Prompt Engineering Guidelines

### Structured Output

Always require JSON output with explicit schema:

```python
# Python example with LangChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel

class DayOption(BaseModel):
    id: str
    title: str
    description: str
    cost: int
    energy_level: Literal["light", "moderate", "strenuous"]
    highlights: List[str]
    events_preview: List[Event]

parser = PydanticOutputParser(pydantic_object=DayOption)

prompt = PromptTemplate(
    template="Generate a day option.\n{format_instructions}\n{query}",
    input_variables=["query"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)
```

### Context Window Management

For day planning, include:
- Full trip metadata (small)
- User profile (small)
- Previous days summary (medium - summarize, don't include full events)
- Current day requirements (small)

Avoid sending full event details of previous days unless necessary.

### Temperature Settings

| Task | Temperature | Reasoning |
|------|-------------|-----------|
| Clarification questions | 0.7 | Needs variety |
| Follow-up responses | 0.5 | Natural but consistent |
| Day option generation | 0.8 | Diversity in options |
| Conflict messages | 0.3 | Consistent, clear messaging |
| Time/cost calculations | 0.0 | Deterministic |

### Validation Layer

Always validate LLM output before returning to frontend:

```python
def validate_day_options(options: List[dict]) -> List[dict]:
    validated = []
    for opt in options:
        # Ensure required fields
        assert opt.get("id"), "Missing option ID"
        assert opt.get("title"), "Missing title"
        assert opt.get("events_preview"), "Missing events"

        # Validate events
        for event in opt["events_preview"]:
            # Ensure time format
            assert re.match(r"^\d{2}:\d{2}$", event["time_start"])
            assert re.match(r"^\d{2}:\d{2}$", event["time_end"])

            # Ensure valid type
            assert event["type"] in ["logistics", "activity", "dining", "transit", "rest"]

        validated.append(opt)

    return validated
```

---

## Validation System

### Current Validation Logic

Located in `src/lib/mock-data/mock-conflicts.ts`.

#### Time Overlap Detection

```typescript
function detectTimeOverlaps(day: Day): Conflict[] {
  const events = day.events
    .filter(e => !e.alternativeGroupId || e.isPrimaryAlternative);

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      const aStart = timeToMinutes(a.time_start);
      const aEnd = timeToMinutes(a.time_end);
      const bStart = timeToMinutes(b.time_start);
      const bEnd = timeToMinutes(b.time_end);

      if (aStart < bEnd && bStart < aEnd) {
        // Overlap detected
      }
    }
  }
}
```

#### Activity Count Check

```typescript
function detectTooManyActivities(day: Day): Conflict | null {
  const activityCount = day.events.filter(
    e => e.type !== 'rest' && e.type !== 'transit'
  ).length;

  if (activityCount > 4) {
    return {
      type: 'too_many_activities',
      severity: 'warning',
      message: `Day ${day.day_number} has ${activityCount} activities...`
    };
  }
}
```

#### Energy Level Check

```typescript
function detectHighEnergyConsecutive(itinerary: Itinerary): Conflict[] {
  const conflicts = [];

  for (let i = 0; i < itinerary.days.length - 1; i++) {
    const current = itinerary.days[i];
    const next = itinerary.days[i + 1];

    if (current.summary.energy_level === 'strenuous' &&
        next.summary.energy_level === 'strenuous') {
      conflicts.push({
        type: 'high_energy_consecutive',
        severity: 'warning',
        dayNumber: next.day_number,
        message: 'Two high-energy days in a row...'
      });
    }
  }

  return conflicts;
}
```

### Extending Validation

Your backend can add additional checks:

- **Distance validation**: Check travel time between consecutive events
- **Operating hours**: Verify venues are open at planned times
- **Booking conflicts**: Check if booking required events are reservable
- **Weather considerations**: Flag outdoor activities during bad weather forecasts

---

## Migration Checklist

### Step 1: Set Up Backend Framework

- [ ] Create FastAPI project structure
- [ ] Set up LangGraph/LangChain for LLM orchestration
- [ ] Configure environment variables for API keys
- [ ] Set up CORS for frontend origin

### Step 2: Implement Chat Endpoint

- [ ] Create `/api/chat` POST endpoint
- [ ] Implement request body parsing matching `ChatRequestBody`
- [ ] Implement phase routing (clarification/planning/editing)
- [ ] Return responses matching `ChatResponse` schema

### Step 3: Implement Clarification Phase

- [ ] Create clarification question generator (LLM or template)
- [ ] Create follow-up response generator (LLM)
- [ ] Track clarification step state
- [ ] Return `next_phase: 'planning'` when complete

### Step 4: Implement Planning Phase

- [ ] Create day option generator (LLM)
- [ ] Ensure 3 options per request
- [ ] Validate `events_preview` structure
- [ ] Handle option selection confirmation
- [ ] Detect day type (arrival/departure/full)

### Step 5: Implement Validation Endpoint

- [ ] Create `/api/validate-edit` POST endpoint
- [ ] Port time overlap detection logic
- [ ] Port activity count validation
- [ ] Port consecutive energy level check
- [ ] Generate optimization suggestions

### Step 6: Update Frontend API Calls

- [ ] Update `API_ENDPOINTS` in `src/lib/constants.ts`
- [ ] Point to your backend URL instead of `/api/mock/*`
- [ ] Add authentication headers if needed
- [ ] Handle new error response formats

### Step 7: Testing

- [ ] Test complete planning flow end-to-end
- [ ] Verify all response types render correctly
- [ ] Test drag-drop with real validation
- [ ] Load test concurrent conversations

---

## File Reference

Key files to understand:

| File | Purpose |
|------|---------|
| `src/app/api/mock/chat/route.ts` | Current chat endpoint implementation |
| `src/app/plan/page.tsx` | Main planning page, drives the flow |
| `src/store/chat-store.ts` | Chat message state management |
| `src/store/trip-store.ts` | Trip data and phase management |
| `src/store/itinerary-store.ts` | Itinerary editing state |
| `src/types/chat.ts` | Chat message types |
| `src/types/trip.ts` | Trip and profile types |
| `src/types/itinerary.ts` | Itinerary structure types |
| `src/lib/mock-data/mock-responses.ts` | Clarification questions and templates |
| `src/lib/mock-data/mock-day-options.ts` | Pre-built day options |
| `src/lib/mock-data/mock-conflicts.ts` | Validation logic |
| `src/components/planning/ChatWindow.tsx` | Chat UI component |
| `src/components/planning/OptionCard.tsx` | Day option display |

---

## Questions?

If you need clarification on any part of this guide or want to discuss implementation approaches, the key areas to focus on are:

1. **LLM Output Consistency**: Ensuring the LLM always returns valid JSON matching the expected schemas
2. **State Management**: The backend doesn't need to track conversation state - the frontend sends all necessary context with each request
3. **Real-time Data**: For production, consider integrating with travel APIs (Google Places, booking.com, etc.) to provide real venue data

Good luck with the backend implementation!

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Codebase Navigation Guide

**IMPORTANT:** Before searching for code, exploring the codebase, or trying to locate files/components/functions, **always consult `codebase_guide.md` first.** This comprehensive guide contains:

- Complete directory structure with file counts
- Component hierarchy and relationships
- State management architecture (all 5 Zustand stores)
- API integration details (real vs mock backends)
- Type system overview
- Key patterns used throughout the codebase
- "Where to edit for X" quick reference table
- Import shortcuts for common modules

**Usage:** Read `codebase_guide.md` to quickly find where code lives instead of manually searching. It maps every major file and explains how components connect.

**Maintenance:** When making significant changes to the codebase (adding new components, stores, hooks, pages, or reorganizing files), **update `codebase_guide.md`** to reflect those changes. Keep it accurate so it remains a reliable navigation resource.

---

## Project Overview

AI-powered trip planning web application that guides users through day-by-day itinerary creation via a conversational agent interface, then presents a drag-drop editable itinerary view. The clarification phase connects to a real Python FastAPI backend; the day planning phase uses mock responses.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Drag-Drop**: dnd-kit (@dnd-kit/core)
- **Backend**: Python FastAPI with LangGraph (clarification phase integrated, day planning still mocked)

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Architecture

### Page Structure

- `/` - Landing page with hero and CTA
- `/plan` - Multi-step planning wizard (input → clarification chat → day-by-day planning)
- `/itinerary/[id]` - Final itinerary view with drag-drop editing

### Key Directories

- `src/components/ui/` - shadcn/ui base components
- `src/components/landing/` - Landing page hero and CTA components
- `src/components/form/` - Reusable form components
- `src/components/clarification/` - Clarification phase question cards (QuestionCard, RankedSelector, ClarificationSummary)
- `src/components/planning/` - Chat interface, option cards, itinerary preview
- `src/components/itinerary/` - Timeline view, day/event cards, edit sidebar
- `src/store/` - Zustand stores
- `src/hooks/` - Custom React hooks (use-chat, use-toast)
- `src/lib/api/` - API client functions for backend communication
- `src/lib/mock-data/` - Canned AI responses and sample itineraries
- `src/app/api/mock/` - Mock API routes for chat, day generation, edit validation

### State Management Pattern

Five Zustand stores manage app state:

- **TripStore**: Trip metadata, user profile, current planning phase
- **ChatStore**: Messages, typing indicator, current options
- **ItineraryStore**: Itinerary data, selected events, edit mode
- **ClarificationStore**: Clarification session state, questions, answers, progress tracking
- **DebugStore**: Debug logging state for development

### API Integration

The app connects to a Python FastAPI backend for clarification:

- `POST /api/clarification/start` - Start a new clarification session
- `POST /api/clarification/respond` - Submit answers and get next questions
- `GET /api/clarification/session/{id}` - Check session status

Mock API routes (`src/app/api/mock/`) are used for day planning phase:

1. Clarification phase: Backend-driven dynamic questions with progress tracking
2. Day planning phase: Present 3 options per day, user selects one (mock)
3. Edit phase: Conflict detection and resolution suggestions (mock)

### Core Data Types

Key interfaces are defined in `src/types/`:

- `TripData`, `UserProfile` - Trip configuration
- `Itinerary`, `Day`, `Event` - Itinerary structure
- `ChatMessage`, `Option` - Chat interface
- `Question`, `QuestionType` - Clarification question types (single_select, multi_select, ranked, text)
- `ClarificationData`, `QuestionsState` - Clarification session data and progress
- `StartSessionRequest`, `RespondRequest` - API request/response types

## Design Patterns

### Drag-Drop Implementation

Use dnd-kit with:

- `handleDragStart` to set active item
- `handleDragEnd` to determine if moving within day or between days
- Trigger validation API after drops to detect conflicts

### Responsive Breakpoints

- Mobile (<768px): Stacked layout, simplified drag-drop
- Tablet (768-1024px): 50/50 split
- Desktop (>1024px): 40/60 chat/preview split

### Color Scheme

- Primary: blue-600
- Secondary: emerald-500
- Accent: amber-500
- Neutral: slate

## Code Quality Principles

**Maintainability and modularity are critical.** The codebase must be easy to modify, refactor, and extend as UI components and features evolve.

### Component Design

- **Single Responsibility**: Each component should do one thing well. Split large components into smaller, focused pieces.
- **Prop-Driven**: Components should be configurable via props, not hardcoded. This makes swapping implementations easier.
- **Separation of Concerns**: Keep UI rendering separate from business logic. Use hooks for logic, components for display.
- **Avoid Tight Coupling**: Components should not depend on specific implementations of sibling components.

### File Organization

- Keep related components together in feature folders (e.g., `clarification/`, `planning/`)
- Export public components via `index.ts` barrel files for clean imports
- Place shared utilities in `lib/` and shared types in `types/`

### When Making Changes

- Prefer editing existing components over creating new ones with similar functionality
- When adding features, consider if the change should be a new component or an extension of an existing one
- Document any non-obvious component interfaces or behaviors with brief comments
- Ensure components can be easily replaced - avoid deeply nested dependencies that make swapping difficult
- **Update `codebase_guide.md`** when adding/removing/moving components, stores, hooks, pages, or API routes

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

If gstack skills aren't working, run `cd .Codex/skills/gstack && ./setup` to build the binary and register skills.

Available gstack skills:
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`

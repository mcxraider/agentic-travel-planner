import { NextRequest, NextResponse } from 'next/server';
import {
  CLARIFICATION_QUESTIONS,
  CLARIFICATION_COMPLETE_MESSAGE,
  RESEARCH_COMPLETE_MESSAGE,
  getDayIntroMessage,
  getDayConfirmationMessage,
  FINAL_DAY_MESSAGE,
  OPTIMIZATION_MESSAGE,
  ITINERARY_COMPLETE_MESSAGE,
} from '@/lib/mock-data/mock-responses';
import { getOptionsForDay } from '@/lib/mock-data/mock-day-options';
import { ChatResponse } from '@/types';

interface ChatRequestBody {
  message: string;
  conversation_id: string;
  context: {
    current_phase: 'clarification' | 'planning' | 'editing';
    clarification_step?: number;
    current_day?: number;
    total_days?: number;
    trip_data?: {
      destination?: string;
      startDate?: string;
    };
  };
}

// Simulate network delay (1-2 seconds)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const body: ChatRequestBody = await request.json();
  const { context } = body;

  // Simulate API delay
  await delay(1000 + Math.random() * 1000);

  let response: ChatResponse;

  switch (context.current_phase) {
    case 'clarification':
      response = handleClarificationPhase(body);
      break;
    case 'planning':
      response = handlePlanningPhase(body);
      break;
    case 'editing':
      response = handleEditingPhase(body);
      break;
    default:
      response = {
        message: "I'm not sure what phase we're in. Let's start over.",
        type: 'info',
      };
  }

  return NextResponse.json(response);
}

function handleClarificationPhase(body: ChatRequestBody): ChatResponse {
  const currentStep = body.context.clarification_step ?? 0;

  // If we haven't asked any questions yet, start with the first one
  if (currentStep === 0) {
    return {
      message: CLARIFICATION_QUESTIONS[0].question,
      type: 'question',
      next_phase: 'clarification',
    };
  }

  // If we're in the middle of questions
  if (currentStep < CLARIFICATION_QUESTIONS.length) {
    const currentQuestion = CLARIFICATION_QUESTIONS[currentStep - 1];
    const nextQuestion = CLARIFICATION_QUESTIONS[currentStep];

    if (nextQuestion) {
      return {
        message: `${currentQuestion.followUp}\n\n${nextQuestion.question}`,
        type: 'question',
        next_phase: 'clarification',
      };
    }
  }

  // If we've answered all questions, move to planning
  return {
    message: CLARIFICATION_COMPLETE_MESSAGE,
    type: 'info',
    next_phase: 'planning',
  };
}

function handlePlanningPhase(body: ChatRequestBody): ChatResponse {
  const currentDay = body.context.current_day ?? 1;
  const totalDays = body.context.total_days ?? 5;

  // Check if this is asking for day options (user selected an option or just moved to this day)
  const isSelectingOption =
    body.message.toLowerCase().includes('option') ||
    body.message.toLowerCase().includes('choose') ||
    body.message.toLowerCase().includes('select') ||
    body.message.match(/^[123]$/);

  // If user selected an option, confirm and potentially move to next day
  if (isSelectingOption && currentDay <= totalDays) {
    // If this is the last day
    if (currentDay === totalDays) {
      return {
        message: FINAL_DAY_MESSAGE,
        type: 'info',
        next_phase: 'review',
      };
    }

    // Confirm selection and ask about next day
    const selectedOption = body.message.includes('1')
      ? 'Option 1'
      : body.message.includes('2')
        ? 'Option 2'
        : 'Option 3';

    return {
      message: getDayConfirmationMessage(currentDay, selectedOption),
      type: 'confirmation',
    };
  }

  // If starting research phase
  if (body.message.toLowerCase().includes('research') || currentDay === 0) {
    return {
      message: RESEARCH_COMPLETE_MESSAGE,
      type: 'info',
    };
  }

  // Present options for the current day
  const isArrival = currentDay === 1;
  const dateStr = body.context.trip_data?.startDate
    ? new Date(body.context.trip_data.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : `Day ${currentDay}`;

  const options = getOptionsForDay(currentDay, totalDays);

  return {
    message: getDayIntroMessage(currentDay, dateStr, isArrival),
    type: 'options',
    options: options,
  };
}

function handleEditingPhase(body: ChatRequestBody): ChatResponse {
  // Handle optimization acceptance
  if (body.message.toLowerCase().includes('yes') || body.message.toLowerCase().includes('apply')) {
    return {
      message: "Done! I've applied the optimizations. " + ITINERARY_COMPLETE_MESSAGE,
      type: 'confirmation',
      next_phase: 'editing',
    };
  }

  // Handle optimization rejection
  if (body.message.toLowerCase().includes('no') || body.message.toLowerCase().includes('skip')) {
    return {
      message: 'No problem! ' + ITINERARY_COMPLETE_MESSAGE,
      type: 'confirmation',
      next_phase: 'editing',
    };
  }

  // Default: offer optimizations
  return {
    message: OPTIMIZATION_MESSAGE,
    type: 'question',
  };
}

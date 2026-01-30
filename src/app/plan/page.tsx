'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, addDays } from 'date-fns';
import {
  ProgressBar,
  InitialInputForm,
  ChatWindow,
  ItineraryPreview,
} from '@/components/planning';
import { TripInputFormData } from '@/components/planning/InitialInputForm';
import {
  QuestionCard,
  CompletenessProgress,
  ClarificationSummary,
  ApiError,
} from '@/components/clarification';
import {
  useTripStore,
  useChatStore,
  useItineraryStore,
  useDebugLog,
  useClarificationStore,
} from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripData, Day, Option, ChatMessage, StartSessionRequest } from '@/types';
import { Loader2, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/constants';
import {
  startClarificationSession,
  submitClarificationResponses,
  ClarificationApiError,
} from '@/lib/api';

// Step numbers for the wizard
const STEP_INPUT = 1;
const STEP_CLARIFICATION = 2;
const STEP_PLANNING = 3;
const STEP_REVIEW = 4;

export default function PlanPage() {
  const router = useRouter();
  const debugLog = useDebugLog();
  const [currentStep, setCurrentStep] = useState(STEP_INPUT);
  const [isResearching, setIsResearching] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(5);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tripData, userProfile, setTripData, setPhase } = useTripStore();
  const { setItinerary } = useItineraryStore();
  const { messages, isTyping, addMessage, setTyping, clearChat } = useChatStore();

  // Clarification store
  const {
    status: clarificationStatus,
    sessionId,
    questions,
    answers,
    completenessScore,
    collectedData,
    error: clarificationError,
    startSession,
    setAnswer,
    setQuestions,
    setCompletenessScore,
    incrementRound,
    setComplete,
    setError: setClarificationError,
    reset: resetClarification,
  } = useClarificationStore();

  // Refs to track initialization and prevent duplicate requests
  const dayOptionsRequestedRef = useRef<number>(0);
  const dayRequestInFlight = useRef(false);

  // Helper to send chat API request (for planning phase)
  const sendChatRequest = useCallback(
    async (
      message: string,
      phase: 'clarification' | 'planning' | 'editing',
      step?: number,
      day?: number
    ) => {
      const requestBody = {
        message,
        conversation_id: `conv_${Date.now()}`,
        context: {
          current_phase: phase,
          clarification_step: step,
          current_day: day,
          total_days: totalDays,
          trip_data: tripData
            ? { destination: tripData.destination, startDate: tripData.startDate }
            : undefined,
        },
      };

      debugLog('api_request', `Chat API: ${phase}`, { message, step, day });

      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      debugLog('api_response', `Chat API response: ${phase}`, {
        type: data.type,
        hasOptions: !!data.options,
      });

      return data;
    },
    [totalDays, tripData, debugLog]
  );

  // Handle initial form submission - Start clarification session
  const handleFormSubmit = async (formData: TripInputFormData) => {
    if (!formData.start_date || !formData.end_date) return;

    setIsSubmitting(true);
    setClarificationError(null);

    const days = differenceInDays(formData.end_date, formData.start_date) + 1;
    setTotalDays(days);

    // Build the API request
    const request: StartSessionRequest = {
      // User profile
      user_name: userProfile.user_name || 'Guest',
      citizenship: userProfile.citizenship || undefined,
      health_limitations: userProfile.health_limitations || undefined,
      work_obligations: userProfile.work_obligations || undefined,
      dietary_restrictions: userProfile.dietary_restrictions || undefined,
      specific_interests:
        userProfile.specific_interests && userProfile.specific_interests.length > 0
          ? userProfile.specific_interests
          : undefined,
      // Trip basics
      destination: formData.destination,
      destination_cities:
        formData.destination_cities.length > 0
          ? formData.destination_cities
          : undefined,
      start_date: format(formData.start_date, 'yyyy-MM-dd'),
      end_date: format(formData.end_date, 'yyyy-MM-dd'),
      budget: formData.budget as number,
      currency: formData.currency,
      travel_party: formData.travel_party,
      budget_scope: formData.budget_scope,
    };

    debugLog('user_action', 'Starting clarification session', {
      destination: formData.destination,
      days,
      budget: formData.budget,
    });

    try {
      const response = await startClarificationSession(request);

      debugLog('api_response', 'Clarification session started', {
        sessionId: response.session_id,
        questionCount: response.questions.length,
      });

      // Initialize clarification store
      startSession(
        response.session_id,
        response.questions,
        response.state.completeness_score
      );

      // Store trip data for later use
      const newTripData: TripData = {
        id: `trip_${Date.now()}`,
        destination: formData.destination,
        destinations:
          formData.destination_cities.length > 0
            ? [formData.destination, ...formData.destination_cities]
            : [formData.destination],
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        budgetCategory: 'moderate', // Will be refined by clarification
        focus: [],
        travelers: 1,
        canDrive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTripData(newTripData);
      setPhase('clarification');
      setCurrentStep(STEP_CLARIFICATION);
    } catch (error) {
      console.error('Failed to start clarification session:', error);
      if (error instanceof ClarificationApiError) {
        setClarificationError(error.message);
      } else {
        setClarificationError(
          'Failed to connect to the server. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submitting answers in clarification phase
  const handleSubmitAnswers = async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    setClarificationError(null);

    debugLog('user_action', 'Submitting clarification answers', {
      answerCount: Object.keys(answers).length,
    });

    try {
      const response = await submitClarificationResponses(sessionId, answers);

      debugLog('api_response', 'Clarification response received', {
        complete: response.complete,
        hasMoreQuestions: !!response.questions,
      });

      if (response.complete && response.collected_data) {
        // Clarification complete - set progress to 100% before completing
        setCompletenessScore(100);
        setComplete(response.collected_data);
      } else if (response.questions && response.state) {
        // More questions
        setQuestions(response.questions);
        setCompletenessScore(response.state.completeness_score);
        incrementRound();
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      if (error instanceof ClarificationApiError) {
        setClarificationError(error.message);
        // If session not found, allow restart
        if (error.statusCode === 404) {
          resetClarification();
        }
      } else {
        setClarificationError(
          'Failed to submit answers. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry after error
  const handleRetry = () => {
    setClarificationError(null);
    if (clarificationStatus === 'idle') {
      // Need to restart from form
      setCurrentStep(STEP_INPUT);
    }
  };

  // Proceed to planning phase after viewing summary
  const handleProceedToPlanning = () => {
    setIsResearching(true);
    clearChat();

    // Add "researching" message
    const researchMessage: ChatMessage = {
      id: `msg_${Date.now()}_research`,
      role: 'assistant',
      content: 'Researching your trip based on your preferences... This will take a moment.',
      timestamp: new Date().toISOString(),
      type: 'info',
    };
    addMessage(researchMessage);

    // Wait 5 seconds then transition to planning
    setTimeout(() => {
      setIsResearching(false);
      setPhase('planning');
      setCurrentStep(STEP_PLANNING);
      setCurrentDay(1);
      dayOptionsRequestedRef.current = 0;
    }, 5000);
  };

  // Check if all current questions are answered
  const allQuestionsAnswered = questions.every((q) => {
    const answer = answers[q.field];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  });

  // Request day options when entering planning phase or after selecting an option
  useEffect(() => {
    const requestDayOptions = async () => {
      if (currentStep !== STEP_PLANNING) return;
      if (isTyping) return;
      if (dayRequestInFlight.current) return;
      if (dayOptionsRequestedRef.current >= currentDay) return;

      dayRequestInFlight.current = true;
      dayOptionsRequestedRef.current = currentDay;

      const dayForThisRequest = currentDay;

      setTyping(true);
      setCurrentOptions(null);

      try {
        const data = await sendChatRequest(
          'get day plans',
          'planning',
          undefined,
          dayForThisRequest
        );

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_day${dayForThisRequest}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          type: data.type,
        };
        addMessage(assistantMessage);

        if (data.options) {
          setCurrentOptions(data.options);
        }
      } catch (error) {
        console.error('Get day options error:', error);
        if (dayOptionsRequestedRef.current === dayForThisRequest) {
          dayOptionsRequestedRef.current = dayForThisRequest - 1;
        }
      } finally {
        setTyping(false);
        dayRequestInFlight.current = false;
      }
    };

    requestDayOptions();
  }, [currentStep, currentDay, isTyping, sendChatRequest, addMessage, setTyping]);

  // Handle option selection in planning phase
  const handleOptionSelect = async (option: Option) => {
    debugLog('user_action', `Selected day ${currentDay} option`, {
      title: option.title,
      cost: option.cost,
    });

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_select`,
      role: 'user',
      content: `I'll go with "${option.title}"`,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    const dayDate = tripData
      ? addDays(new Date(tripData.startDate), currentDay - 1)
      : new Date();

    const newDay: Day = {
      day_number: currentDay,
      date: format(dayDate, 'yyyy-MM-dd'),
      theme: option.title,
      events: option.events_preview,
      summary: {
        total_cost: option.cost,
        active_hours: option.events_preview.reduce(
          (acc, e) => acc + e.duration_minutes / 60,
          0
        ),
        rest_hours: 2,
        energy_level: option.energy_level as Day['summary']['energy_level'],
      },
      locked: true,
    };

    setLockedDays((prev) => [...prev, newDay]);
    setCurrentOptions(null);

    if (currentDay >= totalDays) {
      const completeMessage: ChatMessage = {
        id: `msg_${Date.now()}_complete`,
        role: 'assistant',
        content:
          "Excellent! All days are now planned. Your itinerary is ready! Click 'View Full Itinerary' to see and edit your complete trip plan.",
        timestamp: new Date().toISOString(),
        type: 'confirmation',
      };
      addMessage(completeMessage);
      setCurrentStep(STEP_REVIEW);
    } else {
      const confirmMessage: ChatMessage = {
        id: `msg_${Date.now()}_confirm`,
        role: 'assistant',
        content: `Great choice! Day ${currentDay} is locked in with "${option.title}".\n\nMoving on to Day ${currentDay + 1}...`,
        timestamp: new Date().toISOString(),
        type: 'confirmation',
      };
      addMessage(confirmMessage);
      setCurrentDay((prev) => prev + 1);
    }
  };

  // Handle planning message (text input)
  const handlePlanningMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_response`,
      role: 'assistant',
      content: 'Please select one of the options above by clicking on it.',
      timestamp: new Date().toISOString(),
      type: 'info',
    };
    addMessage(assistantMessage);
  };

  // Navigate to final itinerary
  const handleViewItinerary = () => {
    if (tripData) {
      const finalItinerary = {
        trip_id: tripData.id,
        days: lockedDays,
        metadata: {
          total_cost: lockedDays.reduce((acc, day) => acc + day.summary.total_cost, 0),
          total_days: totalDays,
          locked: false,
        },
      };
      setItinerary(finalItinerary);
      router.push(`/itinerary/${tripData.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <ProgressBar currentStep={currentStep} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Step 1: Initial Input Form */}
        {currentStep === STEP_INPUT && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Let&apos;s plan your trip</h1>
              <p className="text-muted-foreground">
                Tell us about your upcoming adventure
              </p>
            </div>
            <Card className="p-6">
              {clarificationError && (
                <div className="mb-6">
                  <ApiError
                    message={clarificationError}
                    onRetry={handleRetry}
                    isNetworkError={clarificationError.includes('not responding')}
                  />
                </div>
              )}
              <InitialInputForm
                onSubmit={handleFormSubmit}
                isLoading={isSubmitting}
              />
            </Card>
          </div>
        )}

        {/* Step 2: Clarification Questions */}
        {currentStep === STEP_CLARIFICATION && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {clarificationStatus === 'complete'
                  ? 'Review Your Preferences'
                  : 'A few quick questions'}
              </h1>
              <p className="text-muted-foreground">
                Help us personalize your {tripData?.destination} trip
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <CompletenessProgress score={completenessScore} />
            </div>

            {/* Error */}
            {clarificationError && (
              <div className="mb-6">
                <ApiError
                  message={clarificationError}
                  onRetry={handleRetry}
                  isNetworkError={clarificationError.includes('not responding')}
                />
              </div>
            )}

            {/* Researching state */}
            {isResearching ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Researching your trip...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Finding the best options based on your preferences
                  </p>
                </div>
              </Card>
            ) : clarificationStatus === 'complete' && collectedData ? (
              // Summary view
              <div className="space-y-6">
                <ClarificationSummary collectedData={collectedData} />
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleProceedToPlanning}
                >
                  Continue to Planning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Questions view
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.question_id}
                    question={question}
                    value={answers[question.field]}
                    onChange={setAnswer}
                  />
                ))}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitAnswers}
                  disabled={!allQuestionsAnswered || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Day-by-Day Planning */}
        {currentStep === STEP_PLANNING && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Planning Day {currentDay} of {totalDays}
              </h1>
              <p className="text-muted-foreground">
                Choose how you&apos;d like to spend each day
              </p>
            </div>
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Chat - 3 columns on large screens */}
              <Card className="lg:col-span-3 h-[680px] flex flex-col">
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  options={currentOptions}
                  onSendMessage={handlePlanningMessage}
                  onSelectOption={handleOptionSelect}
                />
              </Card>

              {/* Preview - 2 columns on large screens */}
              <Card className="lg:col-span-2 h-[680px]">
                <ItineraryPreview
                  days={lockedDays}
                  currentDayNumber={currentDay}
                  destination={tripData?.destination}
                />
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === STEP_REVIEW && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Your itinerary is ready!</h1>
              <p className="text-muted-foreground mb-6">
                We&apos;ve created a {totalDays}-day trip to {tripData?.destination}{' '}
                just for you.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="p-6 mb-6 text-left">
              <h2 className="font-semibold mb-4">Trip Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span>{tripData?.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates</span>
                  <span>
                    {tripData?.startDate &&
                      format(new Date(tripData.startDate), 'MMM d')}{' '}
                    -{' '}
                    {tripData?.endDate &&
                      format(new Date(tripData.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span>
                    ${lockedDays.reduce((acc, day) => acc + day.summary.total_cost, 0)}
                  </span>
                </div>
              </div>
            </Card>

            <Button size="lg" onClick={handleViewItinerary}>
              View Full Itinerary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

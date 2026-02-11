'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import {
  ProgressBar,
  InitialInputForm,
} from '@/components/planning';
import { TripInputFormData } from '@/components/planning/InitialInputForm';
import {
  QuestionCard,
  CompletenessProgress,
  ClarificationSummary,
  ApiError,
  ConflictWarningBanner,
  AgenticLoadingState,
} from '@/components/clarification';
import {
  useTripStore,
  useDebugLog,
  useClarificationStore,
} from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripData, StartSessionRequest } from '@/types';
import { ArrowRight } from 'lucide-react';
import {
  startClarificationSession,
  submitClarificationResponses,
  ClarificationApiError,
} from '@/lib/api';

// Step numbers for the wizard (steps 1-2 only on this page)
const STEP_INPUT = 1;
const STEP_CLARIFICATION = 2;

export default function PlanPage() {
  const router = useRouter();
  const debugLog = useDebugLog();
  const [currentStep, setCurrentStep] = useState(STEP_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tripData, userProfile, setTripData, setPhase } = useTripStore();

  // Clarification store
  const {
    status: clarificationStatus,
    sessionId,
    questions,
    answers,
    questionsState,
    data: clarificationData,
    error: clarificationError,
    startSession,
    setAnswer,
    setQuestions,
    updateFromResponse,
    setComplete,
    startEditing,
    setError: setClarificationError,
    reset: resetClarification,
    getConflicts,
  } = useClarificationStore();

  // Get conflicts from state
  const conflicts = getConflicts();

  // Handle initial form submission - Start clarification session
  const handleFormSubmit = async (formData: TripInputFormData) => {
    if (!formData.start_date || !formData.end_date) return;

    setIsSubmitting(true);
    setClarificationError(null);

    const days = differenceInDays(formData.end_date, formData.start_date) + 1;

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

      // Initialize clarification store with v2 response
      startSession(
        response.session_id,
        response.questions,
        response.state,
        response.data
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
        hasMoreQuestions: response.questions.length > 0,
      });

      if (response.complete) {
        // Clarification complete
        setComplete(response.data, response.state);
      } else {
        // More questions - use updateFromResponse to update all state at once
        updateFromResponse(response.questions, response.state, response.data);
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
        setClarificationError('Failed to submit answers. Please try again.');
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

  // Handle editing preferences - go back to questions
  const handleEditPreferences = async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    setClarificationError(null);

    debugLog('user_action', 'Editing preferences', { sessionId });

    try {
      // Start editing mode in store (this restores answers from data)
      startEditing();

      // Re-submit to get fresh questions from backend
      const response = await submitClarificationResponses(sessionId, answers);

      if (response.questions.length > 0) {
        setQuestions(response.questions);
      }
    } catch (error) {
      console.error('Failed to start editing:', error);
      if (error instanceof ClarificationApiError) {
        setClarificationError(error.message);
      } else {
        setClarificationError('Failed to edit preferences. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proceed to research phase after viewing summary
  const handleProceedToResearch = () => {
    setPhase('research');
    router.push('/research');
  };

  // Check if all current questions are answered
  const allQuestionsAnswered = questions.every((q) => {
    const answer = answers[q.field];

    // Handle different question types
    switch (q.type) {
      case 'single_select':
        return !!answer;
      case 'multi_select':
        return Array.isArray(answer) && answer.length > 0;
      case 'ranked':
        // Ranked answers are objects like {"1": "...", "2": "...", "3": "..."}
        if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
          return false;
        }
        const rankedObj = answer as Record<string, string>;
        const hasEntries = Object.keys(rankedObj).length > 0;
        // Check min_selections if specified
        if (q.min_selections) {
          return Object.keys(rankedObj).length >= q.min_selections;
        }
        return hasEntries;
      case 'text':
        return typeof answer === 'string' && answer.trim().length > 0;
      default:
        return !!answer;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <header className="sticky top-0 z-40 bg-background border-b">
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
              <CompletenessProgress score={questionsState?.score ?? 0} />
            </div>

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className="mb-6">
                <ConflictWarningBanner conflicts={conflicts} />
              </div>
            )}

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

            {clarificationStatus === 'complete' && clarificationData ? (
              // Summary view
              <div className="space-y-6">
                <ClarificationSummary
                  collectedData={clarificationData}
                  onEdit={handleEditPreferences}
                />
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleProceedToResearch}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Questions view
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
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
                    <AgenticLoadingState isLoading={isSubmitting} />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import {
  useTripStore,
  useClarificationStore,
  useDebugLog,
} from '@/store';
import { TripData, StartSessionRequest } from '@/types';
import {
  startClarificationSession,
  submitClarificationResponses,
  ClarificationApiError,
} from '@/lib/api';

// Step constants
export const STEP_INPUT = 1;
export const STEP_CLARIFICATION = 2;
export const STEP_RESEARCH = 3;
export const STEP_PLANNING = 4;
export const STEP_REVIEW = 5;

export type WizardStep =
  | typeof STEP_INPUT
  | typeof STEP_CLARIFICATION
  | typeof STEP_RESEARCH
  | typeof STEP_PLANNING
  | typeof STEP_REVIEW;

interface TripInputFormData {
  destination: string;
  destination_cities: string[];
  start_date: Date | null;
  end_date: Date | null;
  budget: number;
  currency: string;
  travel_party: string;
  budget_scope: string;
}

interface UsePlanningWizardResult {
  // Current state
  currentStep: WizardStep;
  isSubmitting: boolean;

  // Form submission
  handleFormSubmit: (formData: TripInputFormData) => Promise<void>;

  // Clarification
  handleSubmitAnswers: () => Promise<void>;
  handleEditPreferences: () => Promise<void>;
  handleRetry: () => void;
  allQuestionsAnswered: boolean;

  // Transition to research
  handleProceedToResearch: () => void;

  // Step control
  setCurrentStep: (step: WizardStep) => void;
}

/**
 * Hook that manages the multi-step planning wizard state machine.
 * Orchestrates transitions between input, clarification, and research phases.
 * Planning and review are handled by the /select page.
 *
 * @example
 * const {
 *   currentStep,
 *   handleFormSubmit,
 *   handleSubmitAnswers,
 *   handleProceedToResearch,
 * } = usePlanningWizard();
 */
export function usePlanningWizard(): UsePlanningWizardResult {
  const router = useRouter();
  const debugLog = useDebugLog();

  const [currentStep, setCurrentStep] = useState<WizardStep>(STEP_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store hooks
  const { userProfile, setTripData, setPhase } = useTripStore();

  const {
    status: clarificationStatus,
    sessionId,
    questions,
    answers,
    startSession,
    setQuestions,
    updateFromResponse,
    setComplete,
    startEditing,
    setError: setClarificationError,
    reset: resetClarification,
  } = useClarificationStore();

  // Handle initial form submission - Start clarification session
  const handleFormSubmit = useCallback(
    async (formData: TripInputFormData) => {
      if (!formData.start_date || !formData.end_date) return;

      setIsSubmitting(true);
      setClarificationError(null);

      const days = differenceInDays(formData.end_date, formData.start_date) + 1;

      // Build the API request
      const request: StartSessionRequest = {
        user_name: userProfile.user_name || 'Guest',
        citizenship: userProfile.citizenship || undefined,
        health_limitations: userProfile.health_limitations || undefined,
        work_obligations: userProfile.work_obligations || undefined,
        dietary_restrictions: userProfile.dietary_restrictions || undefined,
        specific_interests:
          userProfile.specific_interests && userProfile.specific_interests.length > 0
            ? userProfile.specific_interests
            : undefined,
        destination: formData.destination,
        destination_cities:
          formData.destination_cities.length > 0 ? formData.destination_cities : undefined,
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
        startSession(response.session_id, response.questions, response.state, response.data);

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
          budgetCategory: 'moderate',
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
          setClarificationError('Failed to connect to the server. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      userProfile,
      debugLog,
      startSession,
      setTripData,
      setPhase,
      setClarificationError,
    ]
  );

  // Handle submitting answers in clarification phase
  const handleSubmitAnswers = useCallback(async () => {
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
        setComplete(response.data, response.state);
      } else {
        updateFromResponse(response.questions, response.state, response.data);
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      if (error instanceof ClarificationApiError) {
        setClarificationError(error.message);
        if (error.statusCode === 404) {
          resetClarification();
        }
      } else {
        setClarificationError('Failed to submit answers. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    sessionId,
    answers,
    debugLog,
    setComplete,
    updateFromResponse,
    setClarificationError,
    resetClarification,
  ]);

  // Retry after error
  const handleRetry = useCallback(() => {
    setClarificationError(null);
    if (clarificationStatus === 'idle') {
      setCurrentStep(STEP_INPUT);
    }
  }, [clarificationStatus, setClarificationError]);

  // Handle editing preferences - go back to questions
  const handleEditPreferences = useCallback(async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    setClarificationError(null);

    debugLog('user_action', 'Editing preferences', { sessionId });

    try {
      startEditing();

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
  }, [sessionId, answers, debugLog, startEditing, setQuestions, setClarificationError]);

  // Proceed to research phase - navigate to /research
  const handleProceedToResearch = useCallback(() => {
    setPhase('research');
    router.push('/research');
  }, [setPhase, router]);

  // Check if all current questions are answered
  const allQuestionsAnswered = questions.every((q) => {
    const answer = answers[q.field];

    switch (q.type) {
      case 'single_select':
        return !!answer;
      case 'multi_select':
        return Array.isArray(answer) && answer.length > 0;
      case 'ranked':
        if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
          return false;
        }
        const rankedObj = answer as Record<string, string>;
        const hasEntries = Object.keys(rankedObj).length > 0;
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

  return {
    currentStep,
    isSubmitting,

    handleFormSubmit,
    handleSubmitAnswers,
    handleEditPreferences,
    handleRetry,
    allQuestionsAnswered,

    handleProceedToResearch,
    setCurrentStep,
  };
}

'use client';

import { ProgressBar, InitialInputForm } from '@/components/planning';
import {
  QuestionCard,
  CompletenessProgress,
  ClarificationSummary,
  ApiError,
  ConflictWarningBanner,
  AgenticLoadingState,
} from '@/components/clarification';
import { useTripStore, useClarificationStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { usePlanningWizard, STEP_INPUT, STEP_CLARIFICATION, useServerHealth } from '@/hooks';
import { API_BASE_URL_LABEL } from '@/lib/env';

export default function PlanPage() {
  const { tripData } = useTripStore();
  const { status: serverStatus } = useServerHealth();
  const isServerHealthy = serverStatus === 'healthy';

  const {
    currentStep,
    isSubmitting,
    handleFormSubmit,
    handleSubmitAnswers,
    handleEditPreferences,
    handleRetry,
    handleProceedToResearch,
    allQuestionsAnswered,
  } = usePlanningWizard();

  const {
    status: clarificationStatus,
    questions,
    answers,
    data: clarificationData,
    error: clarificationError,
    setAnswer,
    getConflicts,
    getComputedScore,
  } = useClarificationStore();

  const conflicts = getConflicts();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <ProgressBar currentStep={currentStep} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentStep === STEP_INPUT && (
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold">Let&apos;s plan your trip</h1>
              <p className="text-muted-foreground">Tell us about your upcoming adventure</p>
            </div>

            {!isServerHealthy && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Backend server is offline. Please start the server at {API_BASE_URL_LABEL}.
                </span>
              </div>
            )}

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
                isServerOffline={!isServerHealthy}
              />
            </Card>
          </div>
        )}

        {currentStep === STEP_CLARIFICATION && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold">
                {clarificationStatus === 'complete'
                  ? 'Review Your Preferences'
                  : 'A few quick questions'}
              </h1>
              <p className="text-muted-foreground">
                Help us personalize your {tripData?.destination} trip
              </p>
            </div>

            <div className="mb-6">
              <CompletenessProgress score={getComputedScore()} />
            </div>

            {conflicts.length > 0 && (
              <div className="mb-6">
                <ConflictWarningBanner conflicts={conflicts} />
              </div>
            )}

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
              <div className="space-y-6">
                <ClarificationSummary
                  collectedData={clarificationData}
                  onEdit={handleEditPreferences}
                />
                <Button size="lg" className="w-full" onClick={handleProceedToResearch}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.field]}
                    onChange={setAnswer}
                  />
                ))}

                {!isServerHealthy && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Backend server is offline. Please start the server at {API_BASE_URL_LABEL}.
                    </span>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitAnswers}
                  disabled={!allQuestionsAnswered || isSubmitting || !isServerHealthy}
                >
                  {isSubmitting ? (
                    <AgenticLoadingState isLoading={isSubmitting} />
                  ) : !isServerHealthy ? (
                    'Server Offline'
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

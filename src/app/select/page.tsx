'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ProgressBar, ChatWindow, ItineraryPreview } from '@/components/planning';
import { useTripStore, useChatStore, useItineraryStore } from '@/store';
import { useDayPlanning } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripData } from '@/types';
import { ArrowRight } from 'lucide-react';
import { MOCK_RESEARCH_INPUT } from '@/lib/mock-data';

const STEP_PLANNING = 4;
const STEP_REVIEW = 5;

function buildMockTripData(): TripData {
  const mock = MOCK_RESEARCH_INPUT;
  return {
    id: `trip_mock_${Date.now()}`,
    destination: mock.trip_details.destination,
    destinations: [mock.trip_details.destination],
    startDate: new Date(mock.trip_details.travel_dates.start).toISOString(),
    endDate: new Date(mock.trip_details.travel_dates.end).toISOString(),
    budgetCategory: 'moderate',
    focus: [],
    travelers: 2,
    canDrive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function SelectPage() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(STEP_PLANNING);
  const [fallbackTripData] = useState(() => buildMockTripData());

  const { tripData, setTripData, setPhase } = useTripStore();
  const { setItinerary } = useItineraryStore();
  const { messages, isTyping } = useChatStore();

  const activeTripData = tripData ?? fallbackTripData;

  const {
    currentDay,
    totalDays,
    lockedDays,
    currentOptions,
    handleOptionSelect,
    handlePlanningMessage,
    reset,
  } = useDayPlanning({
    tripData: activeTripData,
    isEnabled: currentStep === STEP_PLANNING,
    onComplete: () => setCurrentStep(STEP_REVIEW),
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!tripData) {
      setTripData(activeTripData);
    }

    setPhase('planning');
    reset();
  }, [tripData, activeTripData, setTripData, setPhase, reset]);

  const handleViewItinerary = () => {
    const finalItinerary = {
      trip_id: activeTripData.id,
      days: lockedDays,
      metadata: {
        total_cost: lockedDays.reduce((acc, day) => acc + day.summary.total_cost, 0),
        total_days: totalDays,
        locked: false,
      },
    };

    setItinerary(finalItinerary);
    router.push(`/itinerary/${activeTripData.id}`);
  };

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
        {currentStep === STEP_PLANNING && (
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold">
                Planning Day {currentDay} of {totalDays}
              </h1>
              <p className="text-muted-foreground">Choose how you&apos;d like to spend each day</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="flex h-[680px] flex-col lg:col-span-3">
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  options={currentOptions}
                  onSendMessage={handlePlanningMessage}
                  onSelectOption={handleOptionSelect}
                />
              </Card>

              <Card className="h-[680px] lg:col-span-2">
                <ItineraryPreview
                  days={lockedDays}
                  currentDayNumber={currentDay}
                  destination={activeTripData.destination}
                />
              </Card>
            </div>
          </div>
        )}

        {currentStep === STEP_REVIEW && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h1 className="mb-2 text-2xl font-bold">Your itinerary is ready!</h1>
              <p className="mb-6 text-muted-foreground">
                We&apos;ve created a {totalDays}-day trip to {activeTripData.destination} just for
                you.
              </p>
            </div>

            <Card className="mb-6 p-6 text-left">
              <h2 className="mb-4 font-semibold">Trip Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span>{activeTripData.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates</span>
                  <span>
                    {format(new Date(activeTripData.startDate), 'MMM d')} -{' '}
                    {format(new Date(activeTripData.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span>${lockedDays.reduce((acc, day) => acc + day.summary.total_cost, 0)}</span>
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

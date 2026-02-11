'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  ProgressBar,
  ChatWindow,
  ItineraryPreview,
} from '@/components/planning';
import {
  useTripStore,
  useChatStore,
  useItineraryStore,
  useDebugLog,
} from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripData, Day, Option, ChatMessage } from '@/types';
import { ArrowRight } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/constants';
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
  const debugLog = useDebugLog();

  const { tripData, setTripData, setPhase } = useTripStore();
  const { setItinerary } = useItineraryStore();
  const { messages, isTyping, addMessage, setTyping, clearChat } = useChatStore();

  const [currentStep, setCurrentStep] = useState(STEP_PLANNING);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(3);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);

  const dayOptionsRequestedRef = useRef<number>(0);
  const dayRequestInFlight = useRef(false);
  const initializedRef = useRef(false);

  // On mount: ensure tripData exists, or use mock fallback
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let activeTripData = tripData;

    if (!activeTripData) {
      // Standalone mode - build from mock
      activeTripData = buildMockTripData();
      setTripData(activeTripData);
    }

    const days =
      differenceInDays(new Date(activeTripData.endDate), new Date(activeTripData.startDate)) + 1;
    setTotalDays(days);

    setPhase('planning');
    clearChat();
  }, [tripData, setTripData, setPhase, clearChat]);

  // Helper to send chat API request
  const sendChatRequest = useCallback(
    async (
      message: string,
      phase: 'clarification' | 'planning' | 'editing',
      step?: number,
      day?: number
    ) => {
      const activeTripData = tripData ?? buildMockTripData();

      const requestBody = {
        message,
        conversation_id: `conv_${Date.now()}`,
        context: {
          current_phase: phase,
          clarification_step: step,
          current_day: day,
          total_days: totalDays,
          trip_data: {
            destination: activeTripData.destination,
            startDate: activeTripData.startDate,
          },
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

  // Handle option selection
  const handleOptionSelect = async (option: Option) => {
    const activeTripData = tripData ?? buildMockTripData();

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

    const dayDate = addDays(new Date(activeTripData.startDate), currentDay - 1);

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
    const activeTripData = tripData ?? buildMockTripData();

    const finalItinerary = {
      trip_id: activeTripData.id,
      days: lockedDays,
      metadata: {
        total_cost: lockedDays.reduce(
          (acc, day) => acc + day.summary.total_cost,
          0
        ),
        total_days: totalDays,
        locked: false,
      },
    };
    setItinerary(finalItinerary);
    router.push(`/itinerary/${activeTripData.id}`);
  };

  const activeTripData = tripData ?? buildMockTripData();

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
        {/* Day-by-Day Planning */}
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
                  destination={activeTripData.destination}
                />
              </Card>
            </div>
          </div>
        )}

        {/* Review */}
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
                We&apos;ve created a {totalDays}-day trip to {activeTripData.destination}{' '}
                just for you.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="p-6 mb-6 text-left">
              <h2 className="font-semibold mb-4">Trip Summary</h2>
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
                  <span>
                    $
                    {lockedDays.reduce(
                      (acc, day) => acc + day.summary.total_cost,
                      0
                    )}
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

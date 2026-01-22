'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, addDays } from 'date-fns';
import { ProgressBar, InitialInputForm, ChatWindow, ItineraryPreview } from '@/components/planning';
import { useTripStore, useChatStore, useItineraryStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripData, Day, Option, ChatMessage } from '@/types';
import { Loader2, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/constants';

// Step numbers for the wizard
const STEP_INPUT = 1;
const STEP_CLARIFICATION = 2;
const STEP_PLANNING = 3;
const STEP_REVIEW = 4;

interface FormData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budgetCategory: string;
  focus: string[];
  travelers: number;
  additionalNotes: string;
}

export default function PlanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEP_INPUT);
  const [isResearching, setIsResearching] = useState(false);
  const [clarificationStep, setClarificationStep] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(5);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);

  const { tripData, setTripData, setPhase } = useTripStore();
  const { setItinerary } = useItineraryStore();
  const { messages, isTyping, addMessage, setTyping, clearChat } = useChatStore();

  // Refs to track initialization
  const conversationStartedRef = useRef(false);
  const dayOptionsRequestedRef = useRef<number>(0);

  // Helper to send chat API request
  const sendChatRequest = useCallback(
    async (
      message: string,
      phase: 'clarification' | 'planning' | 'editing',
      step?: number,
      day?: number
    ) => {
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      return response.json();
    },
    [totalDays, tripData]
  );

  // Handle initial form submission
  const handleFormSubmit = (formData: FormData) => {
    if (!formData.startDate || !formData.endDate) return;

    const days = differenceInDays(formData.endDate, formData.startDate) + 1;
    setTotalDays(days);

    const newTripData: TripData = {
      id: `trip_${Date.now()}`,
      destination: formData.destination,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      budgetCategory: formData.budgetCategory as TripData['budgetCategory'],
      focus: formData.focus as TripData['focus'],
      travelers: formData.travelers,
      additionalNotes: formData.additionalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTripData(newTripData);
    setPhase('clarification');
    setCurrentStep(STEP_CLARIFICATION);
  };

  // Start clarification chat when entering step 2
  useEffect(() => {
    const startClarification = async () => {
      if (currentStep === STEP_CLARIFICATION && !conversationStartedRef.current) {
        conversationStartedRef.current = true;
        clearChat();
        setTyping(true);

        try {
          const data = await sendChatRequest('start', 'clarification', 0);
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString(),
            type: data.type,
          };
          addMessage(assistantMessage);
          setClarificationStep(1); // Ready for first answer
        } catch (error) {
          console.error('Start conversation error:', error);
        } finally {
          setTyping(false);
        }
      }
    };

    startClarification();
  }, [currentStep, sendChatRequest, clearChat, setTyping, addMessage]);

  // Handle sending message in clarification phase
  const handleClarificationMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setTyping(true);

    try {
      // Send with current step (which represents the question we're answering)
      const data = await sendChatRequest(message, 'clarification', clarificationStep);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        type: data.type,
      };
      addMessage(assistantMessage);

      // Increment step for next question
      setClarificationStep((prev) => prev + 1);

      // Check if clarification is complete
      if (data.next_phase === 'planning') {
        // Start research phase
        setTyping(false);
        startResearchPhase();
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setTyping(false);
    }
  };

  // Research phase with 10-second delay
  const startResearchPhase = async () => {
    setIsResearching(true);

    // Add "researching" message
    const researchMessage: ChatMessage = {
      id: `msg_${Date.now()}_research`,
      role: 'assistant',
      content: 'Researching your trip... This will take a moment.',
      timestamp: new Date().toISOString(),
      type: 'info',
    };
    addMessage(researchMessage);

    // Wait 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Transition to planning phase
    setIsResearching(false);
    setPhase('planning');
    setCurrentStep(STEP_PLANNING);
    setCurrentDay(1);
    dayOptionsRequestedRef.current = 0;
  };

  // Request day options when entering planning phase or after selecting an option
  useEffect(() => {
    const requestDayOptions = async () => {
      if (
        currentStep === STEP_PLANNING &&
        !isTyping &&
        dayOptionsRequestedRef.current < currentDay
      ) {
        dayOptionsRequestedRef.current = currentDay;
        setTyping(true);
        setCurrentOptions(null);

        try {
          const data = await sendChatRequest('show options', 'planning', undefined, currentDay);

          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_day${currentDay}`,
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
        } finally {
          setTyping(false);
        }
      }
    };

    requestDayOptions();
  }, [currentStep, currentDay, isTyping, sendChatRequest, addMessage, setTyping]);

  // Handle option selection in planning phase
  const handleOptionSelect = async (option: Option) => {
    // Add user selection message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_select`,
      role: 'user',
      content: `I'll go with "${option.title}"`,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Lock the current day with the selected option
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
        active_hours: option.events_preview.reduce((acc, e) => acc + e.duration_minutes / 60, 0),
        rest_hours: 2,
        energy_level: option.energy_level as Day['summary']['energy_level'],
      },
      locked: true,
    };

    setLockedDays((prev) => [...prev, newDay]);
    setCurrentOptions(null);

    // Check if this was the last day
    if (currentDay >= totalDays) {
      // Add completion message
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
      // Add confirmation and move to next day
      const confirmMessage: ChatMessage = {
        id: `msg_${Date.now()}_confirm`,
        role: 'assistant',
        content: `Great choice! Day ${currentDay} is locked in with "${option.title}". ✓\n\nMoving on to Day ${currentDay + 1}...`,
        timestamp: new Date().toISOString(),
        type: 'confirmation',
      };
      addMessage(confirmMessage);

      // Move to next day
      setCurrentDay((prev) => prev + 1);
    }
  };

  // Handle planning message (text input instead of option click)
  const handlePlanningMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Simple response for text messages during planning
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
              <p className="text-muted-foreground">Tell us about your upcoming adventure</p>
            </div>
            <Card className="p-6">
              <InitialInputForm onSubmit={handleFormSubmit} />
            </Card>
          </div>
        )}

        {/* Step 2: Clarification Chat */}
        {currentStep === STEP_CLARIFICATION && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">A few quick questions</h1>
              <p className="text-muted-foreground">
                Help us personalize your {tripData?.destination} trip
              </p>
            </div>
            <Card className="h-[500px] flex flex-col">
              {isResearching ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Researching your trip...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Finding the best options for you
                  </p>
                </div>
              ) : (
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  onSendMessage={handleClarificationMessage}
                  disabled={isResearching}
                />
              )}
            </Card>
          </div>
        )}

        {/* Step 3: Day-by-Day Planning */}
        {currentStep === STEP_PLANNING && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Planning Day {currentDay} of {totalDays}
              </h1>
              <p className="text-muted-foreground">Choose how you&apos;d like to spend each day</p>
            </div>
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Chat - 3 columns on large screens */}
              <Card className="lg:col-span-3 h-[600px] flex flex-col">
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  options={currentOptions}
                  onSendMessage={handlePlanningMessage}
                  onSelectOption={handleOptionSelect}
                />
              </Card>

              {/* Preview - 2 columns on large screens */}
              <Card className="lg:col-span-2 h-[600px]">
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
                We&apos;ve created a {totalDays}-day trip to {tripData?.destination} just for you.
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
                    {tripData?.startDate && format(new Date(tripData.startDate), 'MMM d')} -{' '}
                    {tripData?.endDate && format(new Date(tripData.endDate), 'MMM d, yyyy')}
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

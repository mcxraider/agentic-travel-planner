'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useChatStore, useDebugLog } from '@/store';
import { Day, Option, ChatMessage, TripData } from '@/types';
import { API_ENDPOINTS } from '@/lib/constants';

interface UseDayPlanningOptions {
  tripData: TripData | null;
  isEnabled: boolean;
  onComplete?: () => void;
}

interface UseDayPlanningResult {
  currentDay: number;
  totalDays: number;
  lockedDays: Day[];
  currentOptions: Option[] | null;
  isComplete: boolean;

  setTotalDays: (days: number) => void;
  handleOptionSelect: (option: Option) => Promise<void>;
  handlePlanningMessage: (message: string) => void;
  reset: () => void;
}

/**
 * Hook that manages the day-by-day planning phase.
 * Handles day options fetching with request deduplication,
 * option selection, and building the final itinerary.
 *
 * @param options.tripData - Trip data for context
 * @param options.isEnabled - Whether the planning phase is active
 * @param options.onComplete - Callback when all days are planned
 *
 * @example
 * const {
 *   currentDay,
 *   totalDays,
 *   currentOptions,
 *   handleOptionSelect,
 * } = useDayPlanning({
 *   tripData,
 *   isEnabled: currentStep === STEP_PLANNING,
 *   onComplete: () => setCurrentStep(STEP_REVIEW),
 * });
 */
export function useDayPlanning({
  tripData,
  isEnabled,
  onComplete,
}: UseDayPlanningOptions): UseDayPlanningResult {
  const debugLog = useDebugLog();
  const { isTyping, addMessage, setTyping } = useChatStore();

  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(5);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for request deduplication
  const dayOptionsRequestedRef = useRef<number>(0);
  const dayRequestInFlight = useRef(false);

  // Helper to send chat API request
  const sendChatRequest = useCallback(
    async (message: string, day: number) => {
      const requestBody = {
        message,
        conversation_id: `conv_${Date.now()}`,
        context: {
          current_phase: 'planning' as const,
          current_day: day,
          total_days: totalDays,
          trip_data: tripData
            ? { destination: tripData.destination, startDate: tripData.startDate }
            : undefined,
        },
      };

      debugLog('api_request', 'Chat API: planning', { message, day });

      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      debugLog('api_response', 'Chat API response: planning', {
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
      if (!isEnabled) return;
      if (isTyping) return;
      if (dayRequestInFlight.current) return;
      if (dayOptionsRequestedRef.current >= currentDay) return;

      dayRequestInFlight.current = true;
      dayOptionsRequestedRef.current = currentDay;

      const dayForThisRequest = currentDay;

      setTyping(true);
      setCurrentOptions(null);

      try {
        const data = await sendChatRequest('get day plans', dayForThisRequest);

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
  }, [isEnabled, currentDay, isTyping, sendChatRequest, addMessage, setTyping]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    async (option: Option) => {
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
        setIsComplete(true);
        onComplete?.();
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
    },
    [currentDay, totalDays, tripData, addMessage, debugLog, onComplete]
  );

  // Handle text input during planning (prompts user to select option)
  const handlePlanningMessage = useCallback(
    (message: string) => {
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
    },
    [addMessage]
  );

  // Reset the planning state
  const reset = useCallback(() => {
    setCurrentDay(1);
    setLockedDays([]);
    setCurrentOptions(null);
    setIsComplete(false);
    dayOptionsRequestedRef.current = 0;
    dayRequestInFlight.current = false;
  }, []);

  return {
    currentDay,
    totalDays,
    lockedDays,
    currentOptions,
    isComplete,

    setTotalDays,
    handleOptionSelect,
    handlePlanningMessage,
    reset,
  };
}

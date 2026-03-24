'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { differenceInDays, format, addDays } from 'date-fns';
import { useChatStore, useDebugLog } from '@/store';
import { Day, Option, ChatMessage, TripData } from '@/types';
import { useChat } from './use-chat';

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

export function useDayPlanning({
  tripData,
  isEnabled,
  onComplete,
}: UseDayPlanningOptions): UseDayPlanningResult {
  const debugLog = useDebugLog();
  const { addMessage } = useChatStore();

  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  const [lockedDays, setLockedDays] = useState<Day[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Option[] | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const dayOptionsRequestedRef = useRef(0);
  const dayRequestInFlight = useRef(false);

  const { isTyping, sendMessage, resetConversation } = useChat({
    currentPhase: 'planning',
    currentDay,
    totalDays,
    tripData: tripData
      ? { destination: tripData.destination, startDate: tripData.startDate }
      : undefined,
  });

  useEffect(() => {
    if (!tripData) return;

    const computedDays =
      differenceInDays(new Date(tripData.endDate), new Date(tripData.startDate)) + 1;
    setTotalDays(computedDays);
  }, [tripData]);

  useEffect(() => {
    const requestDayOptions = async () => {
      if (!isEnabled) return;
      if (isTyping) return;
      if (dayRequestInFlight.current) return;
      if (dayOptionsRequestedRef.current >= currentDay) return;

      dayRequestInFlight.current = true;
      dayOptionsRequestedRef.current = currentDay;

      const dayForThisRequest = currentDay;
      setCurrentOptions(null);

      try {
        await sendMessage('get day plans', {
          appendUserMessage: false,
          overrideContext: { currentDay: dayForThisRequest },
          onOptionsReceived: setCurrentOptions,
        });
      } catch (error) {
        console.error('Get day options error:', error);
        if (dayOptionsRequestedRef.current === dayForThisRequest) {
          dayOptionsRequestedRef.current = dayForThisRequest - 1;
        }
      } finally {
        dayRequestInFlight.current = false;
      }
    };

    requestDayOptions();
  }, [isEnabled, currentDay, isTyping, sendMessage]);

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

      const dayDate = tripData ? addDays(new Date(tripData.startDate), currentDay - 1) : new Date();

      const newDay: Day = {
        day_number: currentDay,
        date: format(dayDate, 'yyyy-MM-dd'),
        theme: option.title,
        events: option.events_preview,
        summary: {
          total_cost: option.cost,
          active_hours: option.events_preview.reduce(
            (acc, event) => acc + event.duration_minutes / 60,
            0
          ),
          rest_hours: 2,
          energy_level: option.energy_level as Day['summary']['energy_level'],
        },
        locked: true,
      };

      setLockedDays((previousDays) => [...previousDays, newDay]);
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
        return;
      }

      const confirmMessage: ChatMessage = {
        id: `msg_${Date.now()}_confirm`,
        role: 'assistant',
        content: `Great choice! Day ${currentDay} is locked in with "${option.title}".\n\nMoving on to Day ${currentDay + 1}...`,
        timestamp: new Date().toISOString(),
        type: 'confirmation',
      };
      addMessage(confirmMessage);
      setCurrentDay((previousDay) => previousDay + 1);
    },
    [currentDay, totalDays, tripData, addMessage, debugLog, onComplete]
  );

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

  const reset = useCallback(() => {
    setCurrentDay(1);
    setLockedDays([]);
    setCurrentOptions(null);
    setIsComplete(false);
    dayOptionsRequestedRef.current = 0;
    dayRequestInFlight.current = false;
    resetConversation();
  }, [resetConversation]);

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

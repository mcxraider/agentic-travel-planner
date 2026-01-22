'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store';
import { ChatMessage, Option, PlanningPhase } from '@/types';
import { API_ENDPOINTS } from '@/lib/constants';

interface UseChatOptions {
  currentPhase: PlanningPhase;
  clarificationStep?: number;
  currentDay?: number;
  totalDays?: number;
  tripData?: {
    destination?: string;
    startDate?: string;
  };
  onPhaseChange?: (newPhase: PlanningPhase) => void;
  onOptionsReceived?: (options: Option[]) => void;
}

export function useChat(options: UseChatOptions) {
  const { messages, isTyping, currentOptions, addMessage, setTyping, setOptions, clearChat } =
    useChatStore();

  // Use refs to store the latest options without causing re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendMessage = useCallback(
    async (content: string) => {
      const currentOptions = optionsRef.current;

      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);
      setOptions(null);
      setTyping(true);

      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversation_id: `conv_${Date.now()}`,
            context: {
              current_phase: currentOptions.currentPhase,
              clarification_step: currentOptions.clarificationStep,
              current_day: currentOptions.currentDay,
              total_days: currentOptions.totalDays,
              trip_data: currentOptions.tripData,
            },
          }),
        });

        const data = await response.json();

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          type: data.type,
        };
        addMessage(assistantMessage);

        // Handle options if present
        if (data.options && data.options.length > 0) {
          setOptions(data.options);
          currentOptions.onOptionsReceived?.(data.options);
        }

        // Handle phase change if needed
        if (data.next_phase && data.next_phase !== currentOptions.currentPhase) {
          currentOptions.onPhaseChange?.(data.next_phase);
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'info',
        };
        addMessage(errorMessage);
      } finally {
        setTyping(false);
      }
    },
    [addMessage, setOptions, setTyping]
  );

  const selectOption = useCallback(
    async (option: Option) => {
      // Treat option selection as a message
      await sendMessage(`I'll go with "${option.title}"`);
    },
    [sendMessage]
  );

  const startConversation = useCallback(
    async (initialMessage?: string) => {
      const currentOptions = optionsRef.current;

      clearChat();
      setTyping(true);

      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: initialMessage || 'start',
            conversation_id: `conv_${Date.now()}`,
            context: {
              current_phase: currentOptions.currentPhase,
              clarification_step: 0,
              current_day: currentOptions.currentDay,
              total_days: currentOptions.totalDays,
              trip_data: currentOptions.tripData,
            },
          }),
        });

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          type: data.type,
        };
        addMessage(assistantMessage);

        if (data.options && data.options.length > 0) {
          setOptions(data.options);
          currentOptions.onOptionsReceived?.(data.options);
        }
      } catch (error) {
        console.error('Start conversation error:', error);
      } finally {
        setTyping(false);
      }
    },
    [addMessage, clearChat, setOptions, setTyping]
  );

  return {
    messages,
    isTyping,
    currentOptions,
    sendMessage,
    selectOption,
    startConversation,
    clearChat,
  };
}

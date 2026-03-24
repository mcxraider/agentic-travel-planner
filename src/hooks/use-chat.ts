'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store';
import { ChatMessage, Option, PlanningPhase } from '@/types';
import { sendChatMessage } from '@/lib/api';

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

interface SendChatOptions {
  appendUserMessage?: boolean;
  overrideContext?: Partial<UseChatOptions>;
  onOptionsReceived?: (options: Option[]) => void;
  onPhaseChange?: (newPhase: PlanningPhase) => void;
}

function createConversationId() {
  return `conv_${Date.now()}`;
}

export function useChat(options: UseChatOptions) {
  const {
    messages,
    isTyping,
    currentOptions,
    conversationId,
    addMessage,
    setTyping,
    setOptions,
    clearChat,
    setConversationId,
  } = useChatStore();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendMessage = useCallback(
    async (content: string, sendOptions: SendChatOptions = {}) => {
      const latestOptions = {
        ...optionsRef.current,
        ...sendOptions.overrideContext,
      };

      const nextConversationId = conversationId ?? createConversationId();
      if (!conversationId) {
        setConversationId(nextConversationId);
      }

      if (sendOptions.appendUserMessage !== false) {
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };
        addMessage(userMessage);
      }

      setOptions(null);
      setTyping(true);

      try {
        const data = await sendChatMessage({
          message: content,
          conversation_id: nextConversationId,
          context: {
            current_phase: latestOptions.currentPhase,
            clarification_step: latestOptions.clarificationStep,
            current_day: latestOptions.currentDay,
            total_days: latestOptions.totalDays,
            trip_data: latestOptions.tripData,
          },
        });

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
          sendOptions.onOptionsReceived?.(data.options);
          latestOptions.onOptionsReceived?.(data.options);
        }

        if (data.next_phase && data.next_phase !== latestOptions.currentPhase) {
          sendOptions.onPhaseChange?.(data.next_phase);
          latestOptions.onPhaseChange?.(data.next_phase);
        }

        return data;
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
        throw error;
      } finally {
        setTyping(false);
      }
    },
    [addMessage, conversationId, setConversationId, setOptions, setTyping]
  );

  const selectOption = useCallback(
    async (option: Option) => {
      return sendMessage(`I'll go with "${option.title}"`);
    },
    [sendMessage]
  );

  const startConversation = useCallback(
    async (
      initialMessage = 'start',
      sendOptions: Omit<SendChatOptions, 'appendUserMessage'> = {}
    ) =>
      sendMessage(initialMessage, {
        ...sendOptions,
        appendUserMessage: false,
      }),
    [sendMessage]
  );

  const resetConversation = useCallback(() => {
    clearChat();
    setOptions(null);
    setConversationId(null);
  }, [clearChat, setConversationId, setOptions]);

  return {
    messages,
    isTyping,
    currentOptions,
    conversationId,
    sendMessage,
    selectOption,
    startConversation,
    resetConversation,
  };
}

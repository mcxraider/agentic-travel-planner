'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage, Option } from '@/types';
import { OptionCard } from './OptionCard';

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
  options?: Option[] | null;
  onSendMessage: (message: string) => void;
  onSelectOption?: (option: Option) => void;
  disabled?: boolean;
}

export function ChatWindow({
  messages,
  isTyping,
  options,
  onSendMessage,
  onSelectOption,
  disabled = false,
}: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    if (viewport instanceof HTMLElement) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isTyping, options]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Option Cards */}
          {options && options.length > 0 && onSelectOption && (
            <div className="grid gap-3 mt-4">
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  onSelect={() => onSelectOption(option)}
                />
              ))}
            </div>
          )}

          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <MessageInput onSend={onSendMessage} disabled={disabled || isTyping} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Event, Itinerary } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  Sparkles,
  Clock,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface EditChatSidebarProps {
  isOpen: boolean;
  itinerary: Itinerary;
  selectedEventIds: string[];
  onClose: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function EditChatSidebar({
  isOpen,
  itinerary,
  selectedEventIds,
  onClose,
  onClearSelection,
  onDeleteSelected,
}: EditChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you edit your itinerary. Select some events and tell me what you'd like to change, or just ask me for suggestions!",
    },
  ]);

  // Find selected events from itinerary
  const selectedEvents: { event: Event; dayNumber: number }[] = [];
  itinerary.days.forEach((day) => {
    day.events.forEach((event) => {
      if (selectedEventIds.includes(event.id)) {
        selectedEvents.push({ event, dayNumber: day.day_number });
      }
    });
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response (placeholder for Stage 4)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: getPlaceholderResponse(inputValue, selectedEvents.length),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full bg-white border-l shadow-lg transition-all duration-300 z-20',
        isOpen ? 'w-96' : 'w-0 overflow-hidden'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">Edit Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Events Preview */}
        {selectedEvents.length > 0 && (
          <div className="px-4 py-3 border-b bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDeleteSelected}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onClearSelection}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-1 max-h-32 overflow-auto">
              {selectedEvents.map(({ event, dayNumber }) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1"
                >
                  <Badge variant="outline" className="text-[10px] px-1">
                    Day {dayNumber}
                  </Badge>
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">{event.time_start}</span>
                  <span className="truncate font-medium">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <SuggestionChip
              text="Make this day lighter"
              onClick={() => setInputValue('Make this day lighter')}
            />
            <SuggestionChip
              text="Add a restaurant"
              onClick={() => setInputValue('Suggest a restaurant for dinner')}
            />
            <SuggestionChip
              text="Optimize timing"
              onClick={() => setInputValue('Optimize the timing for these events')}
            />
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for help editing..."
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border rounded-full hover:bg-gray-50 transition-colors"
    >
      <MessageSquare className="h-3 w-3" />
      {text}
    </button>
  );
}

// Placeholder responses for Stage 3 (actual AI logic in Stage 4)
function getPlaceholderResponse(userMessage: string, selectedCount: number): string {
  const lowerMessage = userMessage.toLowerCase();

  if (selectedCount === 0) {
    return "I'd be happy to help! Please select some events in the timeline first, then tell me what changes you'd like to make.";
  }

  if (lowerMessage.includes('lighter') || lowerMessage.includes('easier')) {
    return `I can help make your day lighter! In Stage 4, I'll analyze the ${selectedCount} selected event(s) and suggest which ones to remove or reschedule. For now, you can manually delete events by clicking the trash icon.`;
  }

  if (lowerMessage.includes('restaurant') || lowerMessage.includes('dinner') || lowerMessage.includes('food')) {
    return "Great idea! In Stage 4, I'll be able to suggest restaurants based on your location and preferences. For now, you can add a dining event manually using the 'Add Event' button.";
  }

  if (lowerMessage.includes('timing') || lowerMessage.includes('optimize') || lowerMessage.includes('schedule')) {
    return `I can optimize the timing of your ${selectedCount} selected event(s)! In Stage 4, I'll analyze travel times and suggest better scheduling. For now, you can drag and drop events to reorder them.`;
  }

  if (lowerMessage.includes('move') || lowerMessage.includes('switch')) {
    return "To move events, simply drag them to a different day or position in the timeline. I'll help validate the changes in Stage 4!";
  }

  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return `You can delete the ${selectedCount} selected event(s) by clicking the 'Delete' button above, or use the trash icon on individual events.`;
  }

  return `Thanks for your input! I've noted your request about "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}". In Stage 4, I'll be able to make intelligent suggestions and modifications. For now, you can make manual edits using drag-and-drop or the event controls.`;
}

import { Event } from './itinerary';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'question' | 'options' | 'confirmation' | 'info';
  options?: Option[];
  metadata?: {
    day_number?: number;
    event_ids?: string[];
  };
}

export interface Option {
  id: string;
  title: string;
  description: string;
  cost: number;
  energy_level: 'light' | 'moderate' | 'strenuous';
  highlights: string[];
  events_preview: Event[];
}

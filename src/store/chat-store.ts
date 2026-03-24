import { create } from 'zustand';
import { ChatMessage, Option } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  currentOptions: Option[] | null;
  conversationId: string | null;
}

interface ChatActions {
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  setOptions: (options: Option[] | null) => void;
  setConversationId: (id: string | null) => void;
  clearChat: () => void;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  currentOptions: null,
  conversationId: null,
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setTyping: (typing) => set({ isTyping: typing }),

  setOptions: (options) => set({ currentOptions: options }),

  setConversationId: (id) => set({ conversationId: id }),

  clearChat: () => set(initialState),
}));

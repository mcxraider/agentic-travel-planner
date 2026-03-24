import { API_ENDPOINTS } from '@/lib/constants';
import { ChatRequest, ChatResponse } from '@/types';
import { createFetchAdapter } from './adapters';

const chatFetch = createFetchAdapter({
  networkErrorMessage: 'Chat service is unavailable. Please try again.',
});

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return chatFetch<ChatResponse>(API_ENDPOINTS.chat, {
    method: 'POST',
    body: request,
    errorMessagePrefix: 'Failed to send chat message',
  });
}

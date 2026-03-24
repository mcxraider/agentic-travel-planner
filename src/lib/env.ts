const DEFAULT_APP_BASE_URL = 'http://localhost:3000';
const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith('/') ? path : `/${path}`}`;
}

export const APP_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_APP_BASE_URL
);

export const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const API_BASE_URL_LABEL = API_BASE_URL;

export const BACKEND_ENDPOINTS = {
  health: joinUrl(API_BASE_URL, '/health'),
  clarificationStart: joinUrl(API_BASE_URL, '/api/clarification/start'),
  clarificationRespond: joinUrl(API_BASE_URL, '/api/clarification/respond'),
  clarificationSession: joinUrl(API_BASE_URL, '/api/clarification/session'),
} as const;

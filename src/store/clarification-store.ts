import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Question,
  QuestionsState,
  ClarificationData,
  ClarificationState,
} from '@/types';

interface ClarificationActions {
  // Session management
  startSession: (
    sessionId: string,
    questions: Question[],
    state: QuestionsState,
    data: ClarificationData
  ) => void;
  setQuestions: (questions: Question[]) => void;

  // Answer management
  setAnswer: (field: string, value: unknown) => void;
  clearAnswers: () => void;

  // Progress tracking
  updateFromResponse: (
    questions: Question[],
    state: QuestionsState,
    data: ClarificationData
  ) => void;
  incrementRound: () => void;

  // Completion
  setComplete: (data: ClarificationData, state: QuestionsState) => void;

  // Editing
  startEditing: () => void;

  // Error handling
  setError: (error: string | null) => void;

  // Helpers
  getConflicts: () => string[];
  getComputedScore: () => number;

  // Reset
  reset: () => void;
}

const initialState: ClarificationState = {
  status: 'idle',
  sessionId: null,
  currentRound: 0,
  questions: [],
  answers: {},
  questionsState: null,
  data: null,
  error: null,
};

export const useClarificationStore = create<ClarificationState & ClarificationActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: (sessionId, questions, state, data) =>
        set({
          status: 'in_progress',
          sessionId,
          questions,
          questionsState: state,
          data,
          currentRound: 1,
          answers: {},
          error: null,
        }),

      setQuestions: (questions) => set({ questions }),

      setAnswer: (field, value) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [field]: value,
          },
        })),

      clearAnswers: () => set({ answers: {} }),

      updateFromResponse: (questions, state, data) =>
        set((currentState) => ({
          questions,
          questionsState: state,
          data,
          currentRound: currentState.currentRound + 1,
          answers: {}, // Clear answers for new round
        })),

      incrementRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
          answers: {}, // Clear answers for new round
        })),

      setComplete: (data, state) =>
        set({
          status: 'complete',
          data,
          questionsState: state,
          questions: [],
        }),

      startEditing: () =>
        set((state) => {
          // Restore answers from data, filtering to valid answer types
          const restoredAnswers: Record<string, unknown> = {};
          if (state.data) {
            for (const [key, value] of Object.entries(state.data)) {
              // Skip internal fields
              if (key.startsWith('_')) continue;

              if (typeof value === 'string') {
                restoredAnswers[key] = value;
              } else if (
                Array.isArray(value) &&
                value.every((v) => typeof v === 'string')
              ) {
                restoredAnswers[key] = value;
              } else if (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
              ) {
                // Ranked object (e.g., {"1": "...", "2": "...", "3": "..."})
                restoredAnswers[key] = value;
              }
            }
          }
          return {
            status: 'in_progress',
            data: null,
            answers: restoredAnswers,
          };
        }),

      setError: (error) => set({ error }),

      getConflicts: () => {
        const state = get();
        return state.questionsState?.conflicts_detected || [];
      },

      getComputedScore: () => {
        const state = get();

        if (state.status === 'complete') return 100;
        if (state.status === 'idle') return 0;

        const qs = state.questionsState;
        if (!qs) return 0;

        const collected = qs.collected.length;
        const missingTier1 = qs.missing_tier1.length;
        const missingTier2 = qs.missing_tier2.length;
        const totalFields = collected + missingTier1 + missingTier2;

        if (totalFields === 0) return 0;

        let clientScore = (collected / totalFields) * 100;

        // Partial credit for in-progress answers in the current round
        const currentAnswered = Object.keys(state.answers).length;
        const currentTotal = state.questions.length;
        if (currentTotal > 0) {
          const partialCredit =
            (currentAnswered / currentTotal) * (currentTotal / totalFields) * 100;
          clientScore += partialCredit;
        }

        const backendScore = qs.score;
        return Math.max(backendScore, Math.min(Math.round(clientScore), 99));
      },

      reset: () => set(initialState),
    }),
    {
      name: 'clarification-storage',
      partialize: (state) => ({
        // Only persist data for use in planning phase
        data: state.data,
        status: state.status,
        questionsState: state.questionsState,
      }),
    }
  )
);

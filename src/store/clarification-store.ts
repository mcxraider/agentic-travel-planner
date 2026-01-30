import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClarificationQuestion, ClarificationState } from '@/types';

interface ClarificationActions {
  // Session management
  startSession: (
    sessionId: string,
    questions: ClarificationQuestion[],
    completenessScore: number
  ) => void;
  setQuestions: (questions: ClarificationQuestion[]) => void;

  // Answer management
  setAnswer: (field: string, value: string | string[]) => void;
  clearAnswers: () => void;

  // Progress tracking
  setCompletenessScore: (score: number) => void;
  incrementRound: () => void;

  // Completion
  setComplete: (collectedData: Record<string, unknown>) => void;

  // Error handling
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState: ClarificationState = {
  status: 'idle',
  sessionId: null,
  currentRound: 0,
  questions: [],
  answers: {},
  completenessScore: 0,
  collectedData: null,
  error: null,
};

export const useClarificationStore = create<ClarificationState & ClarificationActions>()(
  persist(
    (set) => ({
      ...initialState,

      startSession: (sessionId, questions, completenessScore) =>
        set({
          status: 'in_progress',
          sessionId,
          questions,
          completenessScore,
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

      setCompletenessScore: (score) => set({ completenessScore: score }),

      incrementRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
          answers: {}, // Clear answers for new round
        })),

      setComplete: (collectedData) =>
        set({
          status: 'complete',
          collectedData,
          questions: [],
        }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'clarification-storage',
      partialize: (state) => ({
        // Only persist collectedData for use in planning phase
        collectedData: state.collectedData,
        status: state.status,
      }),
    }
  )
);

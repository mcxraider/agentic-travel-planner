import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TripData, UserProfile, PlanningPhase } from '@/types';

interface TripState {
  tripData: TripData | null;
  tripsById: Record<string, TripData>;
  userProfile: UserProfile;
  currentPhase: PlanningPhase;
}

interface TripActions {
  setTripData: (data: TripData) => void;
  updateTripData: (data: Partial<TripData>) => void;
  loadTripData: (tripId: string) => TripData | null;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setPhase: (phase: PlanningPhase) => void;
  reset: () => void;
}

const initialState: TripState = {
  tripData: null,
  tripsById: {},
  userProfile: {},
  currentPhase: 'input',
};

export const useTripStore = create<TripState & TripActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTripData: (data) =>
        set((state) => ({
          tripData: data,
          tripsById: {
            ...state.tripsById,
            [data.id]: data,
          },
        })),

      updateTripData: (data) =>
        set((state) => ({
          tripData: state.tripData ? { ...state.tripData, ...data } : null,
          tripsById: state.tripData
            ? {
                ...state.tripsById,
                [state.tripData.id]: {
                  ...state.tripData,
                  ...data,
                },
              }
            : state.tripsById,
        })),

      loadTripData: (tripId) => {
        const tripData = get().tripsById[tripId] ?? null;
        if (tripData) {
          set({ tripData });
        }
        return tripData;
      },

      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),

      setPhase: (phase) => set({ currentPhase: phase }),

      reset: () => set(initialState),
    }),
    {
      name: 'trip-storage',
      partialize: (state) => ({
        tripData: state.tripData,
        tripsById: state.tripsById,
        userProfile: state.userProfile,
        currentPhase: state.currentPhase,
      }),
    }
  )
);

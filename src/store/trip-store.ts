import { create } from 'zustand';
import { TripData, UserProfile, PlanningPhase } from '@/types';

interface TripState {
  tripData: TripData | null;
  userProfile: UserProfile;
  currentPhase: PlanningPhase;
}

interface TripActions {
  setTripData: (data: TripData) => void;
  updateTripData: (data: Partial<TripData>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setPhase: (phase: PlanningPhase) => void;
  reset: () => void;
}

const initialState: TripState = {
  tripData: null,
  userProfile: {},
  currentPhase: 'input',
};

export const useTripStore = create<TripState & TripActions>((set) => ({
  ...initialState,

  setTripData: (data) => set({ tripData: data }),

  updateTripData: (data) =>
    set((state) => ({
      tripData: state.tripData ? { ...state.tripData, ...data } : null,
    })),

  updateUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  setPhase: (phase) => set({ currentPhase: phase }),

  reset: () => set(initialState),
}));

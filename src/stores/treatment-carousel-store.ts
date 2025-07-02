import { create } from "zustand";

export interface TreatmentCarouselState {
  scrollSnap?: number;
  setScrollSnap: (scrollSnap: number) => void;
}

export const useTreatmentCarouselStore = create<TreatmentCarouselState>(
  (set) => ({
    scrollSnap: undefined,
    setScrollSnap: (scrollSnap) => set({ scrollSnap }),
  })
);

import { create } from "zustand";

interface RoomSelectionState {
  currentRoomId: string | null;
  setCurrentRoomId: (id: string | null) => void;
}

export const useRoomSelectionStore = create<RoomSelectionState>((set) => ({
  currentRoomId: null,
  setCurrentRoomId: (id) => set({ currentRoomId: id }),
}));

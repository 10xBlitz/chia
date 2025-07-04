import { create } from "zustand";

interface RoomSelectionState {
  currentRoomId: string | null;
  currentRoomUserName: string | null;
  currentRoomCategory: string | null;
  setCurrentRoom: (
    id: string | null,
    userName?: string | null,
    category?: string | null
  ) => void;
}

export const useRoomSelectionStore = create<RoomSelectionState>((set) => ({
  currentRoomId: null,
  currentRoomUserName: null,
  currentRoomCategory: null,
  setCurrentRoom: (id, userName = null, category = null) =>
    set({
      currentRoomId: id,
      currentRoomUserName: userName,
      currentRoomCategory: category,
    }),
}));

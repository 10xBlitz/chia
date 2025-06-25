import { create } from "zustand";

interface ChatRoomState {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
}

export const useChatRoomStore = create<ChatRoomState>((set) => ({
  selectedRoomId: null,
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
}));

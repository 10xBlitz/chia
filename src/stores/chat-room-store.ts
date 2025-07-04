import { create } from "zustand";
import type { Tables } from "@/lib/supabase/types";

interface Recipient {
  id: string;
  name: string;
}

interface ChatRoomState {
  room: Tables<"chat_room"> | null;
  recipient: Recipient | null;
  setRoom: (room: Tables<"chat_room"> | null) => void;
  setRecipient: (recipient: Recipient | null) => void;
}

export const useChatRoomStore = create<ChatRoomState>((set) => ({
  room: null,
  recipient: null,
  setRoom: (r) => set({ room: r }),
  setRecipient: (recipient) => set({ recipient }),
}));

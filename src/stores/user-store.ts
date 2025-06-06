// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { Tables } from "@/lib/supabase/types";

export type UserState = {
  user:
    | (Omit<Tables<"user">, "role"> & {
        role: Tables<"user">["role"] | "" | null;
        email: string;
        clinic?: Tables<"clinic"> | null; // Add clinic info for the user
      })
    | null;
};

export type UserAction = {
  updateUser: (userData: Partial<UserState["user"]>) => void;
};

export type UserStore = UserState & UserAction;

export const createUserStore = (initState: UserState) => {
  return createStore<UserStore>()((set) => ({
    ...initState,
    updateUser: (userData) =>
      set((state) => ({
        user: state.user
          ? { ...state.user, ...userData }
          : (userData as UserState["user"]),
      })),
  }));
};

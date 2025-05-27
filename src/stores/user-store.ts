// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { Tables } from "@/lib/supabase/types";

export type UserState = {
  user:
    | (Omit<Tables<"user">, "role"> & {
        role: Tables<"user">["role"] | "" | null;
        email: string;
      })
    | null;
};

export type UserAction = {
  updateUser: (userData: Partial<UserState>) => void;
};

export type UserStore = UserState & UserAction;

export const createUserStore = (initState: UserState) => {
  // return createStore<UserStore>()(
  //   persist(
  //     (set) => ({
  //       ...initState,
  //       updateUser: (userData) => set(() => userData),
  //     }),
  //     { name: "user-store" }
  //   )
  // );

  return createStore<UserStore>()((set) => ({
    ...initState,
    updateUser: (userData) => set(() => userData),
  }));
};

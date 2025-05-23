// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { Tables } from "@/lib/supabase/types";

export type UserState = Tables<"user"> & {
  email: string;
};

export type UserAction = {
  updateUser: (userData: Partial<UserState>) => void;
};

export type UserStore = UserState & UserAction;




export const defaultInitState: UserState = {
  id: "",
  email: "",
  full_name: "",
  gender: "",
  birthdate:"",
  contact_number: "",
  residence: "",
  work_place: "",
  role: "admin",
  clinic_id: "",
  created_at: "",
};

export const createUserStore = (initState: UserState = defaultInitState) => {
  console.log("-->createUserStore", initState);

  // return createStore<UserStore>()(
  //   persist(
  //     (set) => ({
  //       ...initState,
  //       updateUser: (userData) => set(() => userData),
  //     }),
  //     { name: "user-store" }
  //   )
  // );


   return createStore<UserStore>()(
      (set) => ({
        ...initState,
        updateUser: (userData) => set(() => userData),
      }),
  );
};

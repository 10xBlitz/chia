// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { Tables } from "@/lib/supabase/types";

export type UserState = Tables<"user"> & {
  email: string;
  role: "admin" | "patient" | "dentist" | "dentist_employee";
};

export type UserAction = {
  updateUser: (userData: Partial<UserState>) => void;
};

export type UserStore = UserState & UserAction;




export const defaultInitState: UserState = {
  id: 1,
  email: "",
  full_name: "",
  gender: "",
  birthdate:"",
  contact_number: "",
  residence: "",
  work_place: "",
  region: "",
  role: "admin",
  clinic_id: 0,
  created_at: "",
};

export const createUserStore = (initState: UserState = defaultInitState) => {
  console.log("-->createUserStore", initState);

  return createStore<UserStore>()(
    persist(
      (set) => ({
        ...initState,
        updateUser: (userData) => set(() => userData),
      }),
      { name: "user-store" }
    )
  );
};

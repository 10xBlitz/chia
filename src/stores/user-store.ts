// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

export type UserState = {
  id: string;
  email: string;
  full_name: string;
  gender: string;
  birth_date: Date;
  contact_number: string;
  residence: string;
  work_place: string;
  region: string;
  role: "admin" | "patient" | "dentist" | "dentist_employee";
  clinic_id: number;
  created_at: Date;
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
  birth_date: new Date(),
  contact_number: "",
  residence: "",
  work_place: "",
  region: "",
  role: "admin",
  clinic_id: 0,
  created_at: new Date(),
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

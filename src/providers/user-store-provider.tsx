// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import { type UserStore, createUserStore } from "@/stores/user-store";

export type UserStoreApi = ReturnType<typeof createUserStore>;

export const UserStoreContext = createContext<UserStoreApi | undefined>(
  undefined
);

export const UserStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<UserStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createUserStore({
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
    });
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  // console.log("-->userStoreContext", userStoreContext?.getState());

  if (!userStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`);
  }

  return useStore(userStoreContext, selector);
};

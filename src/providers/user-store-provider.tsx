// src/providers/user-store-provider.tsx
"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStore } from "zustand";

import {
  type UserStore,
  createUserStore,
  type UserState,
} from "@/stores/user-store"; // Ensure UserState is exported
import { supabaseClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export type UserStoreApi = ReturnType<typeof createUserStore>;

export const UserStoreContext = createContext<UserStoreApi | undefined>(
  undefined
);

// Define a default state for when no user is logged in or profile is not found
// Ensure this matches your UserState type, especially clinic_id as nullable
const defaultUserState = {
  id: "",
  email: "",
  full_name: "",
  gender: "",
  birthdate: "", // Consider using a valid default like new Date(0).toISOString() or ""
  contact_number: "",
  residence: "",
  work_place: "",
  role: null, // Or a 'guest' role
  created_at: "",
  clinic_id: null, // Assuming clinic_id can be null
  login_status: "inactive" as Tables<"user">["login_status"], // Default to inactive
};

export const UserStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<UserStoreApi | null>(null);
  const [isStoreInitialized, setIsStoreInitialized] = useState(false);

  // Extend the Window type to include createClient

  useEffect(() => {
    // Attach to window for injected JS in WebView

    let mounted = true;

    const initializeStore = async () => {
      let initialDataForStore: UserState = { user: defaultUserState };
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();
        if (sessionError) {
          console.error("Error getting initial session:", sessionError.message);
          // Early return on session error
          return;
        }
        if (!session?.user) {
          initialDataForStore = { user: defaultUserState };
          return;
        }
        // Only runs if session.user exists
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          initialDataForStore = {
            user: {
              id: profile.id,
              email: session.user.email || "",
              full_name: profile.full_name,
              gender: profile.gender,
              birthdate: profile.birthdate,
              contact_number: profile.contact_number,
              residence: profile.residence,
              work_place: profile.work_place,
              role: profile.role,
              created_at: profile.created_at,
              clinic_id: profile.clinic_id,
              clinic: profile.clinic,
              login_status: profile.login_status,
            },
          };
        } else {
          initialDataForStore = {
            user: {
              ...defaultUserState,
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || "",
              role: session.user.user_metadata.role || "",
            },
          };
        }
      } catch (e) {
        console.error("Unexpected error during store initialization:", e);
      } finally {
        if (mounted) {
          if (!storeRef.current) {
            storeRef.current = createUserStore(initialDataForStore);
          } else {
            storeRef.current.getState().updateUser(initialDataForStore.user);
          }
          setIsStoreInitialized(true);
        }
      }
    };

    initializeStore();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (!storeRef.current) {
            console.warn("onAuthStateChange: storeRef not initialized yet.");
            return;
          }
          if (event === "SIGNED_IN" && session?.user) {
            await fetchProfileAndUpdateStore(
              storeRef.current,
              session.user.id,
              session.user.email
            );
          } else if (event === "SIGNED_OUT") {
            storeRef.current.getState().updateUser(defaultUserState);
          } else if (event === "USER_UPDATED" && session?.user) {
            await fetchProfileAndUpdateStore(
              storeRef.current,
              session.user.id,
              session.user.email
            );
          }
        }, 0);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  // Render children only after the store is initialized
  if (!isStoreInitialized || !storeRef.current) {
    return null; // Or a loading spinner, or some fallback UI
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  if (!userStoreContext) {
    // This error implies that useUserStore is used outside UserStoreProvider
    // or before the store is initialized and provider has rendered.
    throw new Error(
      `useUserStore must be used within a UserStoreProvider, and after the store has been initialized.`
    );
  }

  return useStore(userStoreContext, selector);
};

// --- Helper Functions ---

/**
 * Fetches the user profile (and related clinic) from Supabase.
 * Returns the user profile data or null if not found.
 */
async function fetchUserProfile(userId: string) {
  const { data, error } = await supabaseClient
    .from("user")
    .select("*, clinic!clinic_id(*)")
    .eq("id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data || null;
}

/**
 * Updates the zustand user store with the given user profile data.
 * If no profile is found, falls back to minimal info.
 */
function updateUserStoreWithProfile(
  store: UserStoreApi,
  profile: (Tables<"user"> & { clinic?: Tables<"clinic"> | null }) | null,
  userId: string,
  userEmail?: string
) {
  if (profile) {
    store.getState().updateUser({
      id: profile.id,
      email: userEmail || "",
      full_name: profile.full_name,
      gender: profile.gender,
      birthdate: profile.birthdate,
      contact_number: profile.contact_number,
      residence: profile.residence,
      work_place: profile.work_place,
      role: profile.role,
      created_at: profile.created_at,
      clinic_id: profile.clinic_id,
      clinic: profile.clinic || null,
      login_status: profile.login_status,
    });
  } else {
    store.getState().updateUser({
      ...defaultUserState,
      id: userId,
      email: userEmail || "",
      role: "",
      login_status: "inactive",
    });
  }
}

/**
 * Fetches the user profile and updates the zustand store.
 * Handles errors and fallback logic.
 */
async function fetchProfileAndUpdateStore(
  store: UserStoreApi,
  userId: string,
  userEmail?: string
) {
  try {
    const profile = await fetchUserProfile(userId);
    updateUserStoreWithProfile(store, profile, userId, userEmail);
  } catch (e) {
    console.error("Unexpected error in fetchProfileAndUpdateStore:", e);
    updateUserStoreWithProfile(store, null, userId, userEmail);
  }
}

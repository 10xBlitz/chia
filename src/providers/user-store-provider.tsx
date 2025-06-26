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
import { Tables } from "@/lib/supabase/types";

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
  // useState to ensure children are rendered only after the store is definitely initialized
  const [isStoreInitialized, setIsStoreInitialized] = useState(false);

  // Helper function to fetch user profile and update the store
  const fetchProfileAndUpdateStore = async (
    userId: string,
    userEmail?: string
  ) => {
    if (!storeRef.current) {
      console.warn(
        "fetchProfileAndUpdateStore called before storeRef is initialized."
      );
      return;
    }
    try {
      const { data: userProfileData, error: profileError } =
        await supabaseClient
          .from("user")
          .select("*, clinic(*)") // Fetch user and related clinic in one query
          .eq("id", userId)
          .maybeSingle();

      // PGRST116: "Searched item was not found"
      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching user profile:", profileError.message);
        // Fallback to updating with auth data if profile fetch fails
        storeRef.current.getState().updateUser({
          ...defaultUserState,
          id: userId,
          role: "",
          email: userEmail || "", // Prefer auth email, fallback to profile email
        });
        return;
      }

      if (userProfileData) {
        storeRef.current.getState().updateUser({
          id: userProfileData.id,
          email: userEmail || "",
          full_name: userProfileData.full_name,
          gender: userProfileData.gender,
          birthdate: userProfileData.birthdate,
          contact_number: userProfileData.contact_number,
          residence: userProfileData.residence,
          work_place: userProfileData.work_place,
          role: userProfileData.role,
          created_at: userProfileData.created_at,
          clinic_id: userProfileData.clinic_id,
          clinic: userProfileData.clinic || null, // Attach clinic info if available
          login_status: userProfileData.login_status, // Default to inactive if not set
        });
      } else {
        // Fallback: update with minimal info
        storeRef.current.getState().updateUser({
          ...defaultUserState,
          id: userId,
          email: userEmail || "",
          role: "", // Or a 'guest' role
          login_status: "inactive", // Default to inactive
        });
      }
    } catch (e) {
      console.error("Unexpected error in fetchProfileAndUpdateStore:", e);
      // Fallback to minimal update
      if (storeRef.current) {
        storeRef.current.getState().updateUser({
          ...defaultUserState,
          id: userId,
          email: userEmail || "",
          role: "", // Or a 'guest' role
        });
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeStore = async () => {
      let initialDataForStore: UserState = { user: defaultUserState };
      try {
        // Attempt to get the current session on initial load
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
          console.error("Error getting initial session:", sessionError.message);
        }

        if (!session?.user) {
          // No session means no user is logged in
          initialDataForStore = { user: defaultUserState };
          return;
        }

        if (session?.user) {
          // if (session.user.app_metadata?.provider === "kakao") {
          // await ensureKakaoUserRoleAndProfile(session.user);
          // }
          // If session exists, try to fetch the user profile
          const { data: userProfileData, error: profileError } =
            await supabaseClient
              .from("user")
              .select("*, clinic(*)")
              .eq("id", session.user.id)
              .maybeSingle();

          if (profileError && profileError.code !== "PGRST116") {
            console.error(
              "Error fetching initial user profile:",
              profileError.message
            );
            initialDataForStore = {
              user: {
                ...defaultUserState,
                id: session.user.id,
                email: session.user.email || "",
              },
            };
          } else if (userProfileData) {
            initialDataForStore = {
              user: {
                id: userProfileData.id,
                email: session.user.email || "",
                full_name: userProfileData.full_name,
                gender: userProfileData.gender,
                birthdate: userProfileData.birthdate,
                contact_number: userProfileData.contact_number,
                residence: userProfileData.residence,
                work_place: userProfileData.work_place,
                role: userProfileData.role,
                created_at: userProfileData.created_at,
                clinic_id: userProfileData.clinic_id,
                clinic: userProfileData.clinic,
                login_status: userProfileData.login_status,
              },
            };
          } else {
            // Session exists but no profile, use auth details
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
        }
      } catch (e) {
        console.error("Unexpected error during store initialization:", e);
        // Fallback to default state
      } finally {
        if (mounted) {
          // Create the store instance if it doesn't exist
          if (!storeRef.current) {
            console.log("Creating new store instance.");

            storeRef.current = createUserStore(initialDataForStore);
          } else {
            console.log("Store already exists, updating state.");
            // If store already exists (e.g., due to HMR or re-render), update its state
            storeRef.current.getState().updateUser(initialDataForStore.user);
          }
          setIsStoreInitialized(true);
        }
      }
    };

    initializeStore();

    // Subscribe to auth state changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (!storeRef.current) {
            // This case should be rare if initializeStore completes first
            console.warn("onAuthStateChange: storeRef not initialized yet.");
            return;
          }

          if (event === "SIGNED_IN" && session?.user) {
            await fetchProfileAndUpdateStore(
              session.user.id,
              session.user.email
            );
          } else if (event === "SIGNED_OUT") {
            storeRef.current.getState().updateUser(defaultUserState);
          } else if (event === "USER_UPDATED" && session?.user) {
            // If user's auth details change (e.g. email verified), re-fetch profile
            await fetchProfileAndUpdateStore(
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
  }, []); // Empty dependency array ensures this runs once on mount

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

"use client";

import { useEffect } from "react";

export default function MobileScriptListener() {
  useEffect(() => {
    // Listen for messages from the WebView
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessage = async (event: any) => {
      console.log("WebView received message:", event.data);

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (!data || data.type !== "GOOGLE_ID_TOKEN" || !data.idToken) return;

        if (typeof window.createClient !== "function") return;

        const supabase = window.createClient();

        if (!supabase?.auth?.signInWithIdToken) return;

        const { data: session, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: data.idToken,
        });

        if (error) {
          alert("Supabase authentication error: " + JSON.stringify(error));
          return;
        }

        if (!session) {
          alert("No error but no session returned");
          return;
        }

        const currentSession = await supabase.auth.getSession();
        alert("Current session: " + JSON.stringify(currentSession));

        setTimeout(() => {
          window.location.replace("/auth/sign-up/finish-signup-oAuth");
        }, 500);
      } catch (authError) {
        console.error("Authentication error:", authError);
      }
    };

    //document is for android
    document.addEventListener("message", handleMessage);
    //window is for iOS
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("message", handleMessage);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}

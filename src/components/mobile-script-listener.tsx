"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import toast from "react-hot-toast";

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

        const { data: session, error } =
          await supabaseClient.auth.signInWithIdToken({
            provider: "google",
            token: data.idToken,
          });

        if (error) {
          toast.error("구글 인증에 실패했습니다. 다시 시도해 주세요."); // Google authentication failed. Please try again.
          return;
        }

        if (!session) {
          toast.error("인증 세션을 가져올 수 없습니다. 다시 시도해 주세요."); // Could not retrieve session. Please try again.
          return;
        }

        toast.success("구글 인증이 완료되었습니다!"); // Google authentication successful!

        setTimeout(() => {
          window.location.replace("/auth/sign-up/finish-signup-oAuth");
        }, 500);
      } catch (authError) {
        console.error("Authentication error:", authError);
        toast.error("알 수 없는 인증 오류가 발생했습니다."); // An unknown authentication error occurred.
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

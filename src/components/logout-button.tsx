"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    console.log("---->logout button clicked");
    await supabaseClient.auth.signOut();
    router.push("/");
    console.log("---->User logged out and redirected to home page");
  };

  return <Button onClick={logout}>로그아웃</Button>;
}

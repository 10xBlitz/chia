"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
  };

  return <Button onClick={logout}>로그아웃</Button>;
}

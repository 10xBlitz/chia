"use server";
import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import BottomNavigation from "@/components/bottom-navigation";
import Footer from "@/components/footer";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user?.id;
  const userMeta = user?.user_metadata || {};

  // Determine filter option from search params
  const region = (await searchParams)?.region;

  return (
    <MobileLayout className="!px-0 flex flex-col">
      <header className="pb-3 flex justify-between items-center px-4">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        {userId ? (
          <Link
            href={userMeta.role === "admin" ? "/admin" : "/patient/profile"}
          >
            <UserIcon className="min-w-7 min-h-7" />
          </Link>
        ) : (
          <Link href="/auth/login">
            <Button className="bg-white text-black border-1 hover:bg-black/20">
              로그인 {/**Login */}
            </Button>
          </Link>
        )}
      </header>
      <MainPage region={region} />
      {userId && <BottomNavigation />}
      <Footer />
      {/* Spacer to prevent footer overlap on mobile */}
      {userId && <div className="h-14"></div>}
    </MobileLayout>
  );
}

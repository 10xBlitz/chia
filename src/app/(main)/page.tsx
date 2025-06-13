import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { supabaseClient } from "@/lib/supabase/client";
import BottomNavigation from "@/components/bottom-navigation";
import Footer from "@/components/footer";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaginatedClinicsWthReviews } from "@/lib/supabase/services/clinics.services";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const userData = await supabaseClient.auth.getUser();
  const userId = userData?.data.user?.id;
  const userMeta = userData?.data.user?.user_metadata || {};

  // Determine filter option from search params
  const filterOption = (await searchParams)?.searchByAddress || "모두";
  let regionFilter = "";
  if (filterOption === "근무지") {
    regionFilter = userMeta.work_place || "";
  } else if (filterOption === "거주") {
    regionFilter = userMeta.residence || "";
  }
  // If "모두" or no filter, regionFilter remains ""

  const clinicsRes = await getPaginatedClinicsWthReviews(1, 3, {
    region: regionFilter,
  });
  const clinicsData = clinicsRes.data || [];

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
      <MainPage clinicsData={clinicsData} />
      {userId && <BottomNavigation />}
      <Footer />
      {/* Spacer to prevent footer overlap on mobile */}
      {userId && <div className="h-14"></div>}
    </MobileLayout>
  );
}

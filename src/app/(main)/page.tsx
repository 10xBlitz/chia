"use client";

import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { Suspense } from "react";
import ClinicCardSkeleton from "@/components/loading-skeletons/clinic-card-skeleton";

function MainPageLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      <ClinicCardSkeleton />
      <ClinicCardSkeleton />
    </div>
  );
}

export default function Page() {
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <Suspense fallback={<MainPageLoading />}>
        <MainPage />
      </Suspense>
    </MobileLayout>
  );
}

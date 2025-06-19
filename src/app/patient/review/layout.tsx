import BottomNavigation from "@/components/bottom-navigation";
import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayout>
      {children} <BottomNavigation />
    </MobileLayout>
  );
}

export default ReviewLayout;

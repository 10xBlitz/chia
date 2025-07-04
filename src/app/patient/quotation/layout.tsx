import BottomNavigation from "@/components/bottom-navigation";
import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

const QuotationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <MobileLayout>
      {children} <BottomNavigation forceActiveIndex={1} />
    </MobileLayout>
  );
};

export default QuotationLayout;

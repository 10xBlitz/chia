import BottomNavigation from "@/components/bottom-navigation";
import MobileLayout from "@/components/layout/mobile-layout";
import ProtectedLayout from "@/components/layout/protected-layout";
import React from "react";

const QuotationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedLayout requiredRole={["patient"]}>
      <MobileLayout>
        {children} <BottomNavigation forceActiveIndex={1} />
      </MobileLayout>
    </ProtectedLayout>
  );
};

export default QuotationLayout;

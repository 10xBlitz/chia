import MobileLayout from "@/components/layout/mobile-layout";
import ProtectedLayout from "@/components/layout/protected-layout";
import React from "react";

const ReservationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedLayout requiredRole={["patient"]}>
      <MobileLayout>{children}</MobileLayout>
    </ProtectedLayout>
  );
};

export default ReservationLayout;

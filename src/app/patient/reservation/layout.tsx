import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

const ReservationLayout = ({ children }: { children: React.ReactNode }) => {
  return <MobileLayout>{children}</MobileLayout>;
};

export default ReservationLayout;

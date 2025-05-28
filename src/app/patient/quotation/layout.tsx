import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

const QuotationLayout = ({ children }: { children: React.ReactNode }) => {
  return <MobileLayout>{children}</MobileLayout>;
};

export default QuotationLayout;

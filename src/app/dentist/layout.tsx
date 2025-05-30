import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

interface DentistLayoutProps {
  children?: React.ReactNode;
}

const DentistLayout: React.FC<DentistLayoutProps> = ({ children }) => {
  return <MobileLayout>{children}</MobileLayout>;
};

export default DentistLayout;

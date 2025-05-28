import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  return <MobileLayout className="!px-0">{children}</MobileLayout>;
};

export default HomeLayout;

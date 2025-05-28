import MobileLayout from "@/components/layout/mobile-layout";
import React from "react";

interface ProfileLayoutProps {
  children?: React.ReactNode;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  return <MobileLayout>{children}</MobileLayout>;
};

export default ProfileLayout;

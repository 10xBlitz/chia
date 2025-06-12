import { cn } from "@/lib/utils";
import React from "react";

interface MobileLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        className,
        "px-5 pt-4 max-w-[450px] min-h-dvh mx-auto bg-white shadow-lg"
      )}
    >
      {children}
    </div>
  );
};

export default MobileLayout;

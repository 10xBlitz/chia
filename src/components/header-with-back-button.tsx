import React from "react";
import BackButton from "./back-button";
import { cn } from "@/lib/utils";

interface HeaderWithBackButtonProps {
  className?: string;
  title: string;
  rightAction?: React.ReactNode; // Optional right-aligned action (e.g., kebab menu)
}

const HeaderWithBackButton: React.FC<HeaderWithBackButtonProps> = ({
  className,
  title,
  rightAction,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 mb-5 font-bold font-pretendard-600 text-lg",
        className
      )}
    >
      <BackButton className="-ml-2" />
      <div className="flex flex-row items-center justify-between w-full">
        <span>{title}</span>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
};

export default HeaderWithBackButton;

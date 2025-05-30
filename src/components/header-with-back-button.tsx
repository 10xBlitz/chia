import React from "react";
import BackButton from "./back-button";
import { cn } from "@/lib/utils";

interface HeaderWithBackButtonProps {
  className?: string;
  title: string;
}

const HeaderWithBackButton: React.FC<HeaderWithBackButtonProps> = ({
  className,
  title,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 mb-5 font-bold font-pretendard-600 text-lg",
        className
      )}
    >
      <BackButton className="-ml-2" />
      {title}
    </header>
  );
};

export default HeaderWithBackButton;

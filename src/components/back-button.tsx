"use client";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BackButton = ({
  className,
  fallback = "/",
}: {
  className?: string;
  fallback?: string;
}) => {
  const router = useRouter();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  };
  return (
    <Button
      className={cn(className && className)}
      variant="ghost"
      size="icon"
      type="button"
      onClick={handleBack}
    >
      <Image src="/icons/chevron-left.svg" alt="back" height={20} width={12} />
    </Button>
  );
};

export default BackButton;

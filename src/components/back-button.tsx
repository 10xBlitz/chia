"use client";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BackButton = ({
  className,
  link = "/",
}: {
  className?: string;
  link?: string;
}) => {
  const router = useRouter();
  const handleBack = () => {
    if (link) {
      router.push(link);
    }
    router.back();
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

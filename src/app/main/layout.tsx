"use client";

import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-[460px] mx-auto">
      <header className="py-4 px-4 flex justify-between items-center border-b">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        <Button variant="outline">로그인 {/**login */}</Button>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
}

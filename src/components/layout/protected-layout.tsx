"use client";

import { Enums } from "@/lib/supabase/types";
import { useUserStore } from "@/providers/user-store-provider";
import Link from "next/link";
import { ReactNode } from "react";
import MobileLayout from "./mobile-layout";
import Image from "next/image";

interface ProtectedLayoutProps {
  children: ReactNode;
  requiredRole?: Enums<"user_role"> | Enums<"user_role">[]; // Role can be a single value or an array of values
}

export default function ProtectedLayout({
  children,
  requiredRole,
}: ProtectedLayoutProps) {
  const user = useUserStore((state) => state.user);

  // Extract primitive dependencies for useEffect

  if (user === undefined) {
    return (
      <MobileLayout className="flex items-center justify-center min-h-screen flex-col gap-4 bg-gray-50">
        <Image
          src="/images/chia-logo.png"
          alt="Chia Logo"
          width={80}
          height={80}
          className="mb-4"
          priority
        />
        <span className="text-lg font-semibold text-gray-700">
          로딩 중... {/* Loading... */}
        </span>
      </MobileLayout>
    );
  }

  if (!user || !user.role || !user.id || !user.work_place) {
    return (
      <MobileLayout className="flex items-center justify-center min-h-screen flex-col gap-4 bg-gray-50">
        <Image
          src="/images/chia-logo.png"
          alt="Chia Logo"
          width={80}
          height={80}
          className="mb-4"
          priority
        />
        <span className="text-lg font-semibold text-gray-700">
          로그인이 필요합니다. {/* You need to login */}
        </span>
        <Link
          href="/auth/login"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-base font-medium"
        >
          로그인 페이지로 이동 {/* Go to Login Page */}
        </Link>
      </MobileLayout>
    );
  }

  // If role is required and doesn't match, show not authorized message
  if (
    requiredRole &&
    (Array.isArray(requiredRole)
      ? !user.role || !requiredRole.includes(user.role)
      : user.role !== requiredRole)
  ) {
    return (
      <MobileLayout className="flex items-center justify-center min-h-screen flex-col gap-4 bg-gray-50">
        <Image
          src="/images/chia-logo.png"
          alt="Chia Logo"
          width={80}
          height={80}
          className="mb-4"
          priority
        />
        <span className="text-lg font-semibold text-red-600">
          접근 권한이 없습니다. {/* You are not authorized. */}
        </span>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition text-base font-medium"
        >
          홈으로 이동 {/* Go to Home */}
        </Link>
      </MobileLayout>
    );
  }

  return <>{children}</>;
}

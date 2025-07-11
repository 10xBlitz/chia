import MobileLayout from "@/components/layout/mobile-layout";
import Link from "next/link";
import React from "react";

export default function DeletedAccountPage() {
  return (
    <MobileLayout className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">
        계정이 삭제되었습니다 {/* Your account has been deleted */}
      </h1>
      <p className="text-lg text-center mb-6">
        이 웹사이트의 관리자에게 문의해 주세요.{" "}
        {/* Please contact the admin of the website for support. */}
      </p>

      <Link
        href="/"
        className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
      >
        홈으로 돌아가기 {/* Go back to Home */}
      </Link>
    </MobileLayout>
  );
}

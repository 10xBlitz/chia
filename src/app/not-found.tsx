"use client";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/images/chia-logo.png"
          alt="Chia Dental Logo"
          width={80}
          height={80}
          className="mb-2"
        />
        <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-1">
          페이지를 찾을 수 없습니다.
        </h2>
        {/* Page not found */}
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
        </p>
        {/* The page you requested does not exist or may have been moved. */}
        <Link
          href="/"
          className="inline-block btn-primary px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium shadow hover:opacity-90 transition"
        >
          홈으로 이동 {/* Go to Home */}
        </Link>
      </div>
    </main>
  );
}

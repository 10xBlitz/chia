"use client";
import Link from "next/link";

export default function DentistServiceInquiryUnavailable() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-primary mb-2">
          서비스 문의 기능 준비 중입니다 {/* Service Inquiry Feature Coming Soon */}
        </h1>
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          치과의사를 위한 서비스 문의 기능은 아직 제공되지 않습니다.
          <br />
          {/* Service inquiry for dentists is not yet available. */}
          곧 만나보실 수 있도록 준비 중입니다!
          {/* We're working to bring this feature soon! */}
        </p>
        <Link
          href="/dentist"
          className="inline-block btn-primary px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium shadow hover:opacity-90 transition"
        >
          프로필로 돌아가기 {/* Back to Profile */}
        </Link>
      </div>
    </main>
  );
}

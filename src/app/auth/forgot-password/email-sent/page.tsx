"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import MobileLayout from "@/components/layout/mobile-layout";

export default function EmailSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const redirectLink = searchParams.get("redirect") || "/auth/login";

  return (
    <MobileLayout className="min-h-dvh">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="shadow-none border-none">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">
                이메일이 전송되었습니다 {/* Email has been sent */}
              </CardTitle>
              <CardDescription className="text-center">
                {/* Check your email for the password reset link */}
                비밀번호 재설정 링크를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                {/* We've sent a password reset link to: */}
                다음 이메일 주소로 비밀번호 재설정 링크를 보냈습니다:
              </div>
              <div className="text-center font-medium text-sm bg-muted p-2 rounded">
                {email}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {/* If you don't see the email, check your spam folder */}
                이메일이 보이지 않으면 스팸 폴더를 확인해주세요.
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  asChild
                  className="w-full h-[45px]"
                  variant="default"
                >
                  <Link href={redirectLink}>
                    로그인 페이지로 돌아가기 {/* Back to login */}
                  </Link>
                </Button>

                <Button
                  asChild
                  className="w-full h-[45px]"
                  variant="outline"
                >
                  <Link href="/auth/forgot-password">
                    다시 전송하기 {/* Send again */}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
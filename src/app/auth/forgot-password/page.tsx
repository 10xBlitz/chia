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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import shadcn form components
import { Form } from "@/components/ui/form";
import toast from "react-hot-toast";
import BackButton from "@/components/back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import FormInput from "@/components/form-ui/form-input";
import { supabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요" }), // "Please enter a valid email"
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectLink = searchParams.get("redirect") || "/auth/login";

  //possible redirectLink values:
  // "/" for patient
  // "/dentist" for dentist

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      values.email,
      {
        redirectTo: `${window.location.origin}/auth/update-password?redirect=${redirectLink}`,
      }
    );

    if (error) {
      toast.error(
        "비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요."
      );
      console.error("Error sending reset password email:", error);
    } else {
      // Show success message "Check your email for the reset link."
      toast.success("비밀번호 재설정 링크가 이메일로 전송되었습니다.");
    }

    setIsLoading(false);
  };

  return (
    <MobileLayout className="min-h-dvh">
      <div className="w-full max-w-sm">
        <BackButton />
        <div className={"flex flex-col gap-6"}>
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-2xl">
                {" "}
                비밀번호 재설정 {/* Reset Password */}
              </CardTitle>
              <CardDescription>
                {/* Enter your email below to reset your password */}
                아래에 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleForgotPassword)}>
                  <div className="flex flex-col gap-6">
                    <FormInput
                      control={form.control}
                      name="email"
                      type="email"
                      label="이메일" //Email
                      placeholder="이메일을 입력하세요." //(Enter your email)
                    />

                    <Button
                      type="submit"
                      className="w-full h-[45px]"
                      disabled={isLoading}
                    >
                      {isLoading ? "로딩중...." : "비밀번호 재설정 메일 보내기"}
                      {/** isLoading ? Loading... : Send password reset email  */}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    {/* Already have an account? */}
                    이미 계정이 있으신가요?{" "}
                    <Link
                      href="/auth/login"
                      className="underline underline-offset-4"
                    >
                      로그인
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}

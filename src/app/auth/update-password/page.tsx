"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import shadcn form components
import { Form } from "@/components/ui/form";
import toast from "react-hot-toast";
import MobileLayout from "@/components/layout/mobile-layout";
import FormInput from "@/components/form-ui/form-input";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

const loginSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }), // "Password must be at least 6 characters"
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.", // "Passwords do not match"
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;

export default function UpdatePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectLink = searchParams.get("redirect") || "/auth/login";
  const router = useRouter();

  //possible redirectLink values:
  // "/" for patient
  // "/dentist" for dentist

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleForgotPassword = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    const { error } = await supabaseClient.auth.updateUser({
      password: values.password,
    });

    if (error) {
      if (
        error.message.includes(
          "New password should be different from the old password."
        )
      ) {
        toast.error("새 비밀번호는 이전 비밀번호와 달라야 합니다."); // "New password should be different from the old password."
      } else {
        // Show error message "Failed to update password. Please try again."
        toast.error("비밀번호 업데이트에 실패했습니다. 다시 시도해주세요.");
        toast.error(error.message);
        console.error("Error updating password:", error);
      }
    } else {
      // Show success message "Password updated successfully."
      toast.success("비밀번호가 성공적으로 업데이트되었습니다.");
      router.push(redirectLink);
    }

    setIsLoading(false);
  };

  return (
    <MobileLayout className="min-h-dvh">
      <div className="w-full max-w-sm">
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
                      name="password"
                      type="password"
                      label="비밀번호" //Password
                      placeholder="비밀번호를 입력하세요." //(Enter your password)
                    />
                    <FormInput
                      control={form.control}
                      name="confirmPassword"
                      type="password"
                      label="비밀번호 확인" //Confirm Password
                      placeholder="비밀번호를 다시 입력하세요." //(Re-enter your password)
                    />

                    <Button
                      type="submit"
                      className="w-full h-[45px] btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? "로딩중...." : "비밀번호 재설정 메일 보내기"}
                      {/** isLoading ? Loading... : Send password reset email  */}
                    </Button>
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

"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import shadcn form components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import toast from "react-hot-toast";
import BackButton from "@/components/back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import FormInput from "@/components/form-ui/form-input";

const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요" }),
  password: z.string().min(1, { message: "비밀번호를 입력하세요" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const userRole = useUserStore((select) => select.user?.role);
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "이메일로 로그인"; // Default to 'Login With Email' if not specified
  let signUpLink = "";
  if (title === "이메일로 로그인(환자)") signUpLink = "/auth/sign-up/patient"; // Sign up link for patients
  if (title === "이메일로 로그인(치과)") signUpLink = "/auth/sign-up/dentist"; // Sign up link for dentists

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "patient") {
        router.push("/");
      } else if (userRole === "dentist") {
        router.push("/dentist");
      }
    }
  }, [userRole]);

  return (
    <MobileLayout className="min-h-dvh">
      <div className="w-full max-w-sm">
        <BackButton />
        <div className={"flex flex-col gap-6"}>
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>
                {/* Enter your email below to login to your account */}
                아래에 이메일을 입력하여 계정에 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)}>
                  <div className="flex flex-col gap-6">
                    <FormInput
                      control={form.control}
                      name="email"
                      type="email"
                      label="이메일" //Email
                      placeholder="이메일을 입력하세요." //(Enter your email)
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel className="text-[16px] font-pretendard-600">
                              {/* Password */}
                              비밀번호
                            </FormLabel>
                            <Link
                              href="/auth/forgot-password"
                              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                            >
                              {/* Forgot your password? */}
                              비밀번호를 잊으셨나요?
                            </Link>
                          </div>
                          <FormControl>
                            <Input
                              type="password"
                              className="h-[45px]"
                              // 비밀번호를 입력하세요 (Enter your password)
                              placeholder="비밀번호를 입력하세요"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-[45px] btn-primary"
                      disabled={isLoading}
                    >
                      {/* Login / Logging in... */}
                      {isLoading ? "로그인 중..." : "로그인"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    {/* Don't have an account? */}
                    계정이 없으신가요?{" "}
                    <Link
                      href={signUpLink}
                      className="underline underline-offset-4"
                    >
                      {/* Sign up */}
                      회원가입
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

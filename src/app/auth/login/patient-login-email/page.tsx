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
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import Image from "next/image";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const userRole = useUserStore((select) => select.user?.role);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("userRole", userRole);
    if (userRole) {
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "patient") {
        router.push("/patient/home");
      } else if (userRole === "dentist") {
        router.push("/dentist");
      }
    }
  }, [userRole]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={"flex flex-col gap-6"}>
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-2xl">
                환자 로그인 {/**Patient Login */}
              </CardTitle>
              <CardDescription>
                계정에 로그인하려면 아래에 이메일을 입력하세요.
                {/**Enter your email below to login to your account */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일 {/** Email*/}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="여기에 이메일을 입력하세요" //korean "Enter your email here"
                      required
                      className="h-[45px]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">
                        비밀번호 {/**Password */}
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        비밀번호를 잊으셨나요? {/**Forgot your password? */}
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      className="h-[45px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full h-[45px] btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                    {/* {isLoading ? "Logging in..." : "Login"} */}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {/* Don&apos;t have an account? */}
                  계정이 없으신가요?
                  <Link
                    href="/auth/sign-up/patient"
                    className="underline underline-offset-4"
                  >
                    {/* Sign up  */}
                    가입하기
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

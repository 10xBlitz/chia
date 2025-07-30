"use client";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const PatientHomePage = () => {
  const searchParams = useSearchParams();
  const message = searchParams.get("message"); // Get error message from URL params
  const [isLoading, setIsLoading] = useState(false);

  console.log("---->message:", message);
  const handleSocialLogin = async (provider: "kakao" | "google" | "apple") => {
    setIsLoading(true);
    try {
      // await supabaseClient.auth.signOut(); // Ensure user is signed out before login
      await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/v1/callback`,
        },
      });
    } catch (error) {
      console.log("--->error:", error);
      const providerNames = {
        kakao: "카카오",
        google: "구글",
        apple: "애플",
      };
      toast.error(
        `${providerNames[provider]} 로그인에 실패했습니다. 다시 시도해주세요.`
      );
      setIsLoading(false);
    }
  };

  // Show toast message if redirected with message (e.g., clinic deleted)
  useEffect(() => {
    if (message) {
      toast.error(message);
    }
  }, [message]);

  return (
    <MobileLayout className="min-h-dvh flex flex-col relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="text-sm text-gray-600">로그인 중...</span>
          </div>
        </div>
      )}
      <header className="flex flex-col gap-10">
        <Link href="/">
          <Image
            src={"/images/chia-logo.png"}
            height={84}
            width={106}
            alt="logo"
            className="-ml-[7px]"
          />
        </Link>
        <span
          style={{
            fontSize: "24px",
            lineHeight: "130%",
            letterSpacing: "-2.5%",
            fontFamily: "Pretendard, sans-serif",
            fontWeight: 600,
          }}
        >
          치아로 접수하고 <br />
          대기 없이 진료 받으세요!
        </span>
      </header>

      <div className="w-full  relative flex items-center justify-center">
        <Image
          src={"/images/auth-main.svg"}
          width={268}
          height={268}
          alt="Main Image"
        />
        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white/80 via-white/40 to-transparent"></div>
      </div>

      <Button
        className="bg-[#FEE500] hover:bg-[#e6cf00] h-[44px]  mt-20 w-full text-black text-[14px] pt-[10px] pr-[16px] pb-[10px] pl-[16px] rounded-[6px]"
        style={{
          fontSize: "14px",
          fontFamily: "Pretendard, sans-serif",
          lineHeight: "150%",
          letterSpacing: "-2.5%",
          fontWeight: 600,
        }}
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading}
      >
        {isLoading ? (
          "로딩 중..."
        ) : (
          <>
            <Image
              src={"/icons/message-filled.svg"}
              width={21.559669494628906}
              height={19.9}
              alt="message icon"
            />
            카카오로 시작하기 {/** Get started with Kakao */}
          </>
        )}
      </Button>

      {/* Google Login Button */}
      <Button
        className="bg-white border border-gray-300 hover:bg-gray-100 h-[44px] mt-3 w-full text-black text-[14px] pt-[10px] pr-[16px] pb-[10px] pl-[16px] rounded-[6px] flex items-center justify-center gap-2"
        style={{
          fontSize: "14px",
          fontFamily: "Pretendard, sans-serif",
          lineHeight: "150%",
          letterSpacing: "-2.5%",
          fontWeight: 600,
        }}
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading}
      >
        {isLoading ? (
          "로딩 중..."
        ) : (
          <>
            <Image
              src={"/icons/google.svg"}
              width={20}
              height={20}
              alt="Google icon"
            />
            구글로 시작하기 {/** Get started with Google */}
          </>
        )}
      </Button>

      {/* Apple Login Button */}
      <Button
        className="bg-white border border-gray-300 hover:bg-gray-100 h-[44px] mt-3 w-full text-black text-[14px] pt-[10px] pr-[16px] pb-[10px] pl-[16px] rounded-[6px] flex items-center justify-center gap-2"
        style={{
          fontSize: "14px",
          fontFamily: "Pretendard, sans-serif",
          lineHeight: "150%",
          letterSpacing: "-2.5%",
          fontWeight: 600,
        }}
        onClick={() => handleSocialLogin("apple")}
        disabled={isLoading}
      >
        {isLoading ? (
          "로딩 중..."
        ) : (
          <>
            <Image
              src={"/icons/apple.svg"}
              width={20}
              height={20}
              alt="Apple icon"
            />
            애플로 시작하기 {/** Get started with Apple */}
          </>
        )}
      </Button>

      <div
        className="flex text-[#767676] gap-3 text-[14px] underline flex-col w-full items-center justify-center mt-8"
        style={{
          fontFamily: "Pretendard, sans-serif",
          lineHeight: "150%",
          letterSpacing: "-2.5%",
          fontWeight: 500,
        }}
      >
        <Link
          href="/auth/login/login-with-email?title=이메일로 로그인하기"
          className={isLoading ? "pointer-events-none opacity-50" : ""}
        >
          이메일로 로그인하기 {/** Log in with email */}
        </Link>

        <Link
          href="/auth/login/login-with-email?title=치과 의사로 로그인"
          className={isLoading ? "pointer-events-none opacity-50" : ""}
        >
          치과 의사로 로그인 {/** Log in as dentist */}
        </Link>

        <Link
          href="/auth/login/login-with-email?title=관리자로 로그인"
          className={isLoading ? "pointer-events-none opacity-50" : ""}
        >
          관리자로 로그인 {/** Log in as admin */}
        </Link>
      </div>
    </MobileLayout>
  );
};

export default PatientHomePage;

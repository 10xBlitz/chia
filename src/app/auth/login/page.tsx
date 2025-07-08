"use client";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const PatientHomePage = () => {
  const kakaoLoginHandler = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/v1/callback`,
      },
    });
  };
  return (
    <MobileLayout className="min-h-dvh flex flex-col  ">
      <div className="flex flex-col gap-10">
        <div className="flex items-center">
          <Image
            src={"/images/chia-logo.svg"}
            width={74}
            height={34}
            alt="Chia Logo"
          />
        </div>
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
      </div>

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
        onClick={kakaoLoginHandler}
      >
        <Image
          src={"/icons/message-filled.svg"}
          width={21.559669494628906}
          height={19.9}
          alt="message icon"
        />
        카카오로 시작하기 {/** Get started with Kakao */}
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
        onClick={async () => {
          await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/v1/callback`,
            },
          });
        }}
      >
        <Image
          src={"/icons/google.svg"}
          width={20}
          height={20}
          alt="Google icon"
        />
        구글로 시작하기 {/** Get started with Google */}
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
        <Link href="/auth/login/login-with-email?title=이메일로 로그인하기">
          이메일로 로그인하기 {/** Log in with email */}
        </Link>

        <Link href="/auth/login/login-with-email?title=치과 의사로 로그인">
          치과 의사로 로그인 {/** Log in as dentist */}
        </Link>

        <Link href="/auth/login/login-with-email?title=관리자로 로그인">
          관리자로 로그인 {/** Log in as admin */}
        </Link>
      </div>
    </MobileLayout>
  );
};

export default PatientHomePage;

"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function KakaoTalk() {
  const searchParams = useSearchParams();
  const authCode = searchParams.get("code"); // 인가 코드가 저장되는 변수

  const loginHandler = async (code: string | string[]) => {
    const res = await fetch(`/api/oauth/callback/kakao?code=${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    console.log("data returned from api: ", data); // 데이터 잘 받아오는지 확인용 로그
  };

  // 인가 코드가 저장될 수 있도록 하는 useEffect 훅
  useEffect(() => {
    if (authCode) {
      // 인가 코드가 있을 때만 POST 요청을 보낸다.
      loginHandler(authCode);
    }
  }, [authCode]); // 의존성으로 인가 코드가 저장되는 변수를 사용한다.

  return <div>page</div>;
}

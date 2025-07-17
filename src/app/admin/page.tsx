"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/main/user"); //default page
  }, [router]);

  return <div></div>;
}

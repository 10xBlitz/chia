"use client";
import { useUserStore } from "@/providers/user-store-provider";
import Link from "next/link";

export default function ForbiddenPage() {
  const user = useUserStore((state) => state.user);
  const link = user?.role === "patient" ? "/" : "/dentist";
  return (
    <div className="text-center h-dvh flex flex-col items-center justify-center">
      <h1>403 - Not Authorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link href={link} className="btn-primary p-3 text-white mt-5 rounded-md">
        Go back to home
      </Link>
    </div>
  );
}

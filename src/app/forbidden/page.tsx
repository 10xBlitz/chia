"use client";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="text-center h-dvh flex flex-col items-center justify-center">
      <h1>403 - Not Authorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link href="/" className="btn-primary p-3 text-white mt-5 rounded-md">
        Go back to home
      </Link>
    </div>
  );
}

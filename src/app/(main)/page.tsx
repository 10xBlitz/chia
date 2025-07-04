import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { generateMetadata as createMetadata } from "@/lib/metadata";
import Link from "next/link";

export const metadata = createMetadata({
  path: "/",
});

export default async function Page() {
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <MainPage />

      <Link href="/pwa">pwa</Link>
    </MobileLayout>
  );
}

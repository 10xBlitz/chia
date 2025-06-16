import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://chia-azure.vercel.app"),
  openGraph: {
    images: [
      {
        url: "/opengraph-image.png",
        alt: "치과 시술 플랫폼 로고",
      },
    ],
  },
};

export default async function Page() {
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <MainPage />
    </MobileLayout>
  );
}

import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "치과 시술 플랫폼", // "Dental Procedure Platform"
  description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "https://chia-azure.vercel.app/images/chia-logo.svg",
  },
  openGraph: {
    title: "og title",
    description: "og description",
    images: [
      {
        url: "https://url",
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

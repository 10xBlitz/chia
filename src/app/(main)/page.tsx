import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";

export const metadata = {
  title: "치과 시술 플랫폼", // "Dental Procedure Platform"
  description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "https://chia-azure.vercel.app/images/chia-logo.svg",
  },
  openGraph: {
    title: "치과 시술 플랫폼",
    description: "치과 시술 견적 및 예약 플랫폼",
    url: "https://chia-azure.vercel.app",
    siteName: "치과 시술 플랫폼",
    images: [
      {
        url: "https://hmhtqgzcqoxssuhtmscp.supabase.co/storage/v1/object/public/banner-images/banner-1.png", // fixed double slash
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

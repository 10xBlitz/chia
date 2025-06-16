import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";

export const metadata = {
  title: "aaa", // "Dental Procedure Platform"
  description: "bbb", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "https://chia-azure.vercel.app/images/chia-logo.svg",
  },
  openGraph: {
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

import { Metadata } from "next";
import MainPage from "./(main)/main-content";

export const metadata: Metadata = {
  title: "치과 시술 플랫폼", // "Dental Procedure Platform"
  description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "/images/chia-logo.svg",
  },
  openGraph: {
    title: "치과 시술 플랫폼", // "Dental Procedure Platform"
    description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
    siteName: "치과 시술 플랫폼",
    images: [
      {
        url: "https://hmhtqgzcqoxssuhtmscp.supabase.co/storage/v1/object/public/clinic-images//2471d7e1-f871-4bdd-ba84-9755cf7f38f3.png", // Absolute URL for OG image
        width: 800,
        height: 600,
        alt: "My custom alt",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

function Page() {
  return <MainPage />;
}

export default Page;

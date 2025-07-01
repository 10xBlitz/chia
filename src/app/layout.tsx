import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import { UserStoreProvider } from "@/providers/user-store-provider";
import CustomQueryClientProvider from "@/providers/query-client-provider";
import { ToasterProvider } from "@/providers/toast-provider";
import { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "치과 시술 플랫폼", // "Dental Procedure Platform"
  description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "https://chia-azure.vercel.app/images/chia-logo.svg",
  },
  openGraph: {
    title: "치과 시술 플랫폼", // "Dental Procedure Platform"
    description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
    url: "https://chia-azure.vercel.app",
    siteName: "Chia",
    images: [
      {
        url: "https://chia-azure.vercel.app/images/chia-logo.svg",
        width: 1200,
        height: 630,
        alt: "Chia Logo",
      },
    ],
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CustomQueryClientProvider>
          <UserStoreProvider>{children}</UserStoreProvider>
          <ToasterProvider />
        </CustomQueryClientProvider>
      </body>
    </html>
  );
}

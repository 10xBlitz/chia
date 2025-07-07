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
  title: "치아 - 치과 플랫폼", // 치과 플랫폼 (Dental Clinic Platform)
  description:
    "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.", // Dental clinic platform for clinics, reviews, and reservations
  metadataBase: new URL("https://chia.ai.kr"),
  openGraph: {
    title: "치아 - 치과 플랫폼", // Dental Clinic Platform
    description:
      "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.", // Dental clinic platform for clinics, reviews, and reservations
    siteName: "치아 (Chia)",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://chia.ai.kr/opengraph-image.png", // Absolute, public OG image URL
        width: 1200,
        height: 630,
        alt: "치아 로고", // Chia logo
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "치아 - 치과 플랫폼",
    description:
      "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.",
    images: ["https://chia.ai.kr/opengraph-image.png"],
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

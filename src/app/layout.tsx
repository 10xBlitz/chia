import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import { UserStoreProvider } from "@/providers/user-store-provider";
import CustomQueryClientProvider from "@/providers/query-client-provider";
import { ToasterProvider } from "@/providers/toast-provider";

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
    icon: "/images/chia-logo.svg",
  },
  openGraph: {
    title: "치과 시술 플랫폼",
    description: "치과 시술 견적 및 예약 플랫폼",
    url: "https://chia-azure.vercel.app/", // Replace with your website's base URL
    type: "website",
    images: [
      {
        url: "/images/chia-logo.svg", // Path to your preview image
        width: 1200,
        height: 630,
        alt: "My Website Preview",
      },
      // You can add more images if needed
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CustomQueryClientProvider>
          <UserStoreProvider>
            <main className="bg-[#F1F1F5]">{children}</main>
          </UserStoreProvider>
          <ToasterProvider />
        </CustomQueryClientProvider>
      </body>
    </html>
  );
}

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

// export const metadata: Metadata = {
//   title: "치과 시술 플랫폼", // "Dental Procedure Platform"
//   description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
//   icons: {
//     icon: "/images/chia-logo.svg",
//   },
//   openGraph: {
//     title: "치과 시술 플랫폼", // "Dental Procedure Platform"
//     description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
//     siteName: "치과 시술 플랫폼",
//     images: [
//       {
//         url: "/images/chia-logo.svg", // Use local SVG image
//         width: 54,
//         height: 24,
//         alt: "Chia Logo",
//       },
//     ],
//     locale: "ko_KR",
//     type: "website",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="치과 시술 플랫폼" />
        <meta
          property="og:description"
          content="치과 시술 견적 및 예약 플랫폼"
        />
        <meta property="og:siteName" content="치과 시술 플랫폼" />
        <meta
          property="og:image"
          content="https://chia-azure.vercel.app/images/chia-logo.png"
        />
        <meta property="og:image:width" content="154" />
        <meta property="og:image:height" content="124" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="bg-[#F1F1F5]">
          <CustomQueryClientProvider>
            <UserStoreProvider>{children}</UserStoreProvider>
            <ToasterProvider />
          </CustomQueryClientProvider>
        </main>
      </body>
    </html>
  );
}

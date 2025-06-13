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
//         url: "https://hmhtqgzcqoxssuhtmscp.supabase.co/storage/v1/object/public/clinic-images//2471d7e1-f871-4bdd-ba84-9755cf7f38f3.png", // Absolute URL for OG image
//         width: 800,
//         height: 600,
//         alt: "My custom alt",
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
          content="https://hmhtqgzcqoxssuhtmscp.supabase.co/storage/v1/object/public/clinic-images//2471d7e1-f871-4bdd-ba84-9755cf7f38f3.png"
        />
        <meta property="og:image:width" content="800px" />
        <meta property="og:image:height" content="600px" />
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

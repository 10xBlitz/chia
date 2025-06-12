// src/app/admin/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Page",
  description: "Learn more about our admin platform.",
  openGraph: {
    title: "About Us",
    description: "Learn more about our admin platform.",
    images: [
      {
        url: "https://chia-azure.vercel.app/images/fallback-image.png",
        width: 800,
        height: 600,
        alt: "About OG Image",
      },
    ],
    type: "website",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full">
        <AppSidebar />
        <main className="flex-1 p-5 bg-[#F1F1F5]">{children}</main>
      </div>
    </SidebarProvider>
  );
}

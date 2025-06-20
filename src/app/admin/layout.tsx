import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";

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

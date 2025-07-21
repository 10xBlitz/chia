"use client";
import { LogoutButton } from "@/components/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronUp,
  Hospital,
  MessageCircle,
  Settings,
  Stethoscope,
  Star,
  User2,
  Users,
  Zap,
  Image,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "유저 관리", // User Management
    url: "/admin/main/user",
    icon: Users,
  },
  {
    title: "병원 관리", // Clinic Management
    url: "/admin/main/clinic",
    icon: Hospital,
  },
  {
    title: "병원 이벤트", // Clinic Event
    url: "/admin/main/clinic-event",
    icon: Zap,
  },
  {
    title: "진료 항목", // Treatments
    url: "/admin/main/treatment",
    icon: Stethoscope,
  },
  {
    title: "배너 관리", // Banner Management
    url: "/admin/main/banner",
    icon: Image,
  },

  {
    title: "예약 관리", // Reservation Management
    url: "/admin/main/reservation",
    icon: Calendar,
  },
  {
    title: "견적 요청 관리", // Quotation Management
    url: "/admin/main/quotation",
    icon: FileText,
  },
  {
    title: "리뷰 관리", // Review Management
    url: "/admin/main/review",
    icon: Star,
  },
  {
    title: "고객센터", // Customer Service
    url: "/admin/customer-service",
    icon: MessageCircle,
  },
  {
    title: "설정", // Settings
    url: "/admin/main/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      {/* Sidebar Header */}
      <div className="flex items-center gap-4 px-6 py-6 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
          {/* User avatar icon */}
          <User2 className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-gray-900">관리자</span>{" "}
          {/* Example name, replace with dynamic if needed */}
          <span className="text-sm text-gray-500 mt-0.5">관리자</span>{" "}
          {/* Admin */}
        </div>
      </div>
      {/* End Sidebar Header */}
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "hover:bg-gray-500/30",
                      pathname === item.url && "bg-gray-500/20"
                    )}
                  >
                    {/* <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a> */}

                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <LogoutButton></LogoutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

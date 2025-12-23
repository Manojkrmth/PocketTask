'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Wallet,
  Settings,
  Bell,
  Shield,
  Home
} from "lucide-react";
import { Button } from "../ui/button";

const menuItems = [
  { href: "/cmadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cmadmin/users", label: "Users", icon: Users },
  { href: "/cmadmin/tasks", label: "Tasks", icon: ListChecks },
  { href: "/cmadmin/payments", label: "Payments", icon: Wallet },
  { href: "/cmadmin/notifications", label: "Notifications", icon: Bell },
  { href: "/cmadmin/settings", label: "Settings", icon: Settings },
  { href: "/cmadmin/admins", label: "Admins", icon: Shield },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  asChild
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                 <Link href="/" legacyBehavior passHref>
                    <SidebarMenuButton asChild>
                         <a>
                            <Home />
                            <span>Back to App</span>
                         </a>
                    </SidebarMenuButton>
                 </Link>
            </SidebarMenuItem>
          </SidebarMenu>
       </SidebarFooter>
    </>
  );
}

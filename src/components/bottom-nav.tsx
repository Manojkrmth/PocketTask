'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Wallet, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/team", label: "Team", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/withdraw", label: "Withdraw", icon: Wallet },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const HIDDEN_PATHS = ['/login', '/signup', '/forgot-password', '/update-password'];

export function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-primary/90 border-t grid grid-cols-5 items-center shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.href === '/tasks') {
          return (
            <div key={item.href} className="relative flex justify-center items-center h-full">
               <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-16 w-16 -translate-y-4 rounded-full text-white shadow-lg transition-transform hover:scale-105",
                  "bg-gradient-to-br from-orange-400 via-red-500 to-yellow-400 animate-pulse-background"
                )}
              >
                <item.icon className="w-7 h-7" />
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 group h-full",
              isActive 
                ? "text-orange-300" 
                : "text-primary-foreground/70"
            )}
          >
            <item.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

    
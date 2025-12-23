'use client';

// =================================================================
// BOTTOM NAVIGATION BAR CODE (for your new project)
// Path: components/bottom-nav.tsx
// =================================================================
// Description:
// This component creates the fixed bottom navigation bar for the user-facing
// part of the app. It includes links to the main sections: Home, Team,
// Tasks, Withdraw, and Profile. The Tasks button is highlighted.
//
// How it works:
// 1. It defines an array of navigation items in the desired order.
// 2. It uses the `usePathname` hook to determine the current page's URL.
// 3. It maps over the navigation items, applying special styling to the 'Tasks' button
//    to make it raised and animated.
// 4. If an item's `href` matches the current `pathname`, it applies an "active" style.
//
// Dependencies:
// - next/link
// - next/navigation
// - lucide-react
// - @/lib/utils

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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t md:left-1/2 md:-translate-x-1/2 md:max-w-md md:rounded-t-2xl">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.label === "Tasks") {
            return (
              <div key={item.href} className="relative flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "absolute -top-6 flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-full transition-all duration-300 shadow-lg",
                    "bg-orange-500 hover:bg-orange-600 text-white animate-pulse",
                    isActive && "ring-4 ring-orange-300 animate-none"
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
                "flex flex-col items-center justify-center gap-1 transition-colors duration-200 group text-muted-foreground",
                "hover:text-primary",
                isActive && "text-primary"
              )}
            >
              <item.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

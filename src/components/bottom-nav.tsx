'use client';

// =================================================================
// BOTTOM NAVIGATION BAR CODE (for your new project)
// Path: components/bottom-nav.tsx
// =================================================================
// Description:
// This component creates the fixed bottom navigation bar for the user-facing
// part of the app. It includes links to the main sections: Home, Tasks, 
// Withdraw, Team, and Profile.
//
// How it works:
// 1. It defines an array of navigation items, each with a path, label, and icon.
// 2. It uses the `usePathname` hook from Next.js to determine the current page's URL.
// 3. It maps over the navigation items to create a button for each.
// 4. If an item's `href` matches the current `pathname`, it applies an "active" style
//    to highlight the current page's button.
// 5. The entire bar is styled to be fixed at the bottom of the screen for easy access.
//
// Dependencies:
// - next/link (for client-side navigation)
// - next/navigation (for the usePathname hook)
// - lucide-react (for icons)
// - @/lib/utils (for the cn utility to merge class names)

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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-primary/90 border-t grid grid-cols-5 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 group",
              isActive 
                ? "bg-orange-400 text-white" 
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

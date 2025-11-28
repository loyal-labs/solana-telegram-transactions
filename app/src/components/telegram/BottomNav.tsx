"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { Brain, LayoutGrid, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const navItems: NavItem[] = [
  { href: "/telegram/overview", icon: LayoutGrid },
  { href: "/telegram/wallet", icon: Wallet },
  { href: "/telegram/agents", icon: Brain },
  { href: "/telegram/profile", icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="mx-auto max-w-md px-4 pb-2"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom))"
        }}
      >
        <div
          className="flex items-center p-1 rounded-full overflow-hidden"
          style={{
            background: "rgba(128, 128, 128, 0.1)",
            backdropFilter: "blur(22px)"
          }}
        >
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href === "/telegram/wallet" && pathname === "/telegram");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex-1 flex items-center justify-center py-3 rounded-full transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.06]"
                    : "active:bg-white/[0.04]"
                }`}
                style={isActive ? { mixBlendMode: "lighten" } : undefined}
              >
                <Icon
                  className={`w-7 h-7 transition-colors ${
                    isActive ? "text-white" : "text-white/60"
                  }`}
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

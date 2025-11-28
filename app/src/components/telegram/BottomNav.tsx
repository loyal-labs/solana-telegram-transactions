"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { Bot, LayoutGrid, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/telegram/overview", label: "Overview", icon: LayoutGrid },
  { href: "/telegram/wallet", label: "Wallet", icon: Wallet },
  { href: "/telegram/agents", label: "Agents", icon: Bot },
  { href: "/telegram/profile", label: "Profile", icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div
        className="mx-auto max-w-md px-3"
        style={{
          paddingBottom: "max(6px, env(safe-area-inset-bottom))"
        }}
      >
        <div
          className="flex items-center justify-around rounded-xl px-1 py-1"
          style={{
            background: "rgba(28, 31, 38, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(20px)"
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
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-white/10"
                    : "active:bg-white/10"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span
                  className={`text-[9px] font-medium transition-colors ${
                    isActive ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

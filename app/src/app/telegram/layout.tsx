"use client";

import { useSignal, viewport } from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import Header from "@/components/Header";
import BottomNav from "@/components/telegram/BottomNav";

export default function TelegramLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  const pathname = usePathname();

  // Reset scroll position when navigating between pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Header height: safe area + 10px + logo (27px) + padding bottom (16px)
  const headerHeight = Math.max(safeAreaInsetTop || 0, 12) + 10 + 27 + 16;

  return (
    <div
      className="flex flex-col"
      style={{ background: "#000", minHeight: "100vh" }}
    >
      <Header />
      <div
        className="flex-1"
        style={{ paddingTop: headerHeight }}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

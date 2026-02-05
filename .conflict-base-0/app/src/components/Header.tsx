"use client";

import { useSignal, viewport } from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-center border-0"
      style={{
        paddingTop: Math.max(safeAreaInsetTop || 0, 12) + 10,
        paddingBottom: 16,
        background: "#16161a",
        borderBottom: "none",
        boxShadow: "none",
      }}
    >
      <Image src="/Logo.svg" alt="Loyal" width={91} height={27} priority />
      {/* Fade gradient - only visible when scrolled */}
      <div
        className="absolute left-0 right-0 pointer-events-none transition-opacity duration-150"
        style={{
          bottom: -12,
          height: 12,
          background: "linear-gradient(to bottom, #16161a, transparent)",
          opacity: isScrolled ? 1 : 0,
        }}
      />
    </header>
  );
}

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
  const [logoOpacity, setLogoOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 0);
      // Fade logo out between 80–160px of scroll (when balance card exits viewport)
      const opacity = y < 80 ? 1 : y > 160 ? 0 : 1 - (y - 80) / 80;
      setLogoOpacity(opacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-center"
      style={{
        paddingTop: Math.max(safeAreaInsetTop || 0, 12) + 10,
        paddingBottom: 16,
        background: "#000",
        borderBottom: "none",
        boxShadow: "none",
      }}
    >
      <Image
        src="/Logo.svg"
        alt="Loyal"
        width={98}
        height={29}
        priority
        style={{
          marginTop: -4,
          opacity: logoOpacity,
          transition: "opacity 0.15s ease-out",
        }}
      />
      {/* Bottom border line - only visible when scrolled */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none transition-opacity duration-150"
        style={{
          bottom: -6,
          height: 6,
          background: "linear-gradient(to bottom, #000, transparent)",
          opacity: isScrolled ? 1 : 0,
        }}
      />
      {/* Bottom border line - only visible when scrolled */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none transition-opacity duration-150"
        style={{
          height: 1,
          background: "rgba(255, 255, 255, 0.08)",
          opacity: isScrolled ? 1 : 0,
        }}
      />
    </header>
  );
}

"use client";
import Lottie from "lottie-react";
import { memo, useEffect, useRef, useState } from "react";

import { type BentoItem, bentoItems } from "@/data/bento";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";

function BentoAnimation({ item, delay }: { item: BentoItem; delay: number }) {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(item.animationPath)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(console.error);
  }, [item.animationPath]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setShouldPlay(true), delay);
    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  const aspectRatio = item.colSpan === 2 ? "795 / 389" : "1 / 1";

  return (
    <div
      ref={ref}
      className="shrink-0 w-full overflow-hidden"
      style={{ aspectRatio, background: "#F5F5F5" }}
    >
      {animationData !== null && shouldPlay && (
        <Lottie
          animationData={animationData}
          loop
          style={{
            width: "100%",
            height: "100%",
            opacity: 1,
            animation: "bentoFadeIn 0.6s ease-out",
          }}
        />
      )}
    </div>
  );
}

function BentoGridSectionComponent() {
  return (
    <section
      id="about-section"
      style={{
        position: "relative",
        padding: "64px 16px",
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      <style>{`
        @keyframes bentoFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div style={{ paddingBottom: "48px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "48px",
                fontWeight: 600,
                color: "#000",
                letterSpacing: "-0.96px",
                lineHeight: "48px",
                margin: 0,
              }}
            >
              About Loyal
            </h2>
            <p
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "20px",
                fontWeight: 400,
                color: "rgba(60, 60, 67, 0.6)",
                lineHeight: "24px",
                margin: 0,
              }}
            >
              The future of agentic finance
            </p>
          </div>
        </div>

        <BentoGrid>
          {bentoItems.map((item, i) => (
            <BentoGridItem
              animationDelay={i * 0.03}
              className={
                item.colSpan === 2 ? "md:col-[2/span_2]" : "md:col-span-1"
              }
              description={item.description}
              header={<BentoAnimation delay={i * 200} item={item} />}
              key={item.title}
              title={item.title}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

export const BentoGridSection = memo(BentoGridSectionComponent);

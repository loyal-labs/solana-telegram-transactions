"use client";
import { AnimatePresence } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import { bentoTabs } from "@/data/bento";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";

function BentoGridSectionComponent() {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const getIndicatorStyle = () => {
    const tab = tabRefs.current[activeTab];
    if (!tab) {
      return { left: 0, width: 0, opacity: 0 };
    }

    return {
      left: tab.offsetLeft,
      width: tab.offsetWidth,
      opacity: 1,
    };
  };

  const tabs = bentoTabs.map((tab) => ({
    label: tab.label,
    content: tab.items.map((item) => ({
      title: item.title,
      description: item.description,
      className:
        item.visualKey === "cardFour" || item.visualKey === "cardFive"
          ? "md:col-span-2"
          : "md:col-span-1",
    })),
  }));

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
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "48px",
            fontWeight: 600,
            color: "#000",
            textAlign: "center",
            marginBottom: "20px",
            letterSpacing: "-0.96px",
            lineHeight: "48px",
          }}
        >
          About Loyal
        </h2>
        <p
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "24px",
            fontWeight: 400,
            color: "rgba(60, 60, 67, 0.6)",
            textAlign: "center",
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: "28px",
          }}
        >
          Private AI conversations with cutting-edge technology
        </p>

        {/* Segmented Control */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "28px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              gap: "0.125rem",
              background: "#F5F5F5",
              borderRadius: "60px",
              padding: "4px",
              maxWidth: "800px",
            }}
          >
            {/* Active tab indicator */}
            {isReady && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  bottom: "4px",
                  left: getIndicatorStyle().left,
                  width: getIndicatorStyle().width,
                  background: "#F9363C",
                  borderRadius: "9999px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: "none",
                  zIndex: 0,
                  opacity: getIndicatorStyle().opacity,
                }}
              />
            )}

            {tabs.map((tab, index) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(index)}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                style={{
                  position: "relative",
                  padding: "8px 16px",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  fontFeatureSettings: "'liga' off, 'clig' off",
                  color:
                    activeTab === index
                      ? "#FFFFFF"
                      : "rgba(60, 60, 67, 0.6)",
                  background: "transparent",
                  border: "none",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  zIndex: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <BentoGrid
            className="mx-auto max-w-5xl"
            key={activeTab}
          >
            {tabs[activeTab].content.map((item, i) => (
              <BentoGridItem
                animationDelay={i * 0.03}
                className={item.className}
                description={item.description}
                key={`${activeTab}-${i}`}
                title={item.title}
              />
            ))}
          </BentoGrid>
        </AnimatePresence>
      </div>
    </section>
  );
}

export const BentoGridSection = memo(BentoGridSectionComponent);

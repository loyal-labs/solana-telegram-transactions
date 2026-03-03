"use client";
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconCoin,
  IconFileBroken,
  IconGitBranch,
  IconLock,
  IconMessage,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import localFont from "next/font/local";
import { memo, type ReactNode, useEffect, useRef, useState } from "react";
import { type BentoItemVisualKey, bentoTabs } from "@/data/bento";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { Spotlight } from "./ui/spotlight-new";

const instrumentSerif = localFont({
  src: [
    {
      path: "../../public/fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
});

function BentoGridSectionComponent() {
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force re-render after refs are populated
    setIsReady(true);
  }, []);

  const getIndicatorStyle = () => {
    const index = hoveredTab !== null ? hoveredTab : activeTab;
    const tab = tabRefs.current[index];
    if (!tab) {
      return { left: 0, width: 0, opacity: 0 };
    }

    return {
      left: tab.offsetLeft,
      width: tab.offsetWidth,
      opacity: 1,
    };
  };

  return (
    <section
      id="about-section"
      style={{
        position: "relative",
        padding: "4rem 1rem",
        overflow: "hidden",
      }}
    >
      <Spotlight />
      {/* Main glass container */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
          background: "rgba(26, 26, 26, 0.3)",
          backdropFilter: "blur(24px) saturate(150%)",
          WebkitBackdropFilter: "blur(24px) saturate(150%)",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow:
            "0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)",
          padding: "3rem 2rem",
        }}
      >
        <h2
          className={instrumentSerif.className}
          style={{
            fontSize: "2.5rem",
            fontWeight: 400,
            color: "#fff",
            textAlign: "center",
            marginBottom: "0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          About Loyal
        </h2>
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.5)",
            textAlign: "center",
            maxWidth: "500px",
            margin: "0 auto 2rem",
            lineHeight: 1.5,
          }}
        >
          Private AI conversations with cutting-edge technology
        </p>

        {/* Tabs Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          <div
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              position: "relative",
              display: "inline-flex",
              gap: "0.125rem",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "9999px",
              padding: "4px",
            }}
          >
            {/* Active tab indicator */}
            <div
              style={{
                position: "absolute",
                top: "4px",
                bottom: "4px",
                left: tabRefs.current[activeTab]?.offsetLeft ?? 0,
                width: tabRefs.current[activeTab]?.offsetWidth ?? 0,
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {tabs.map((tab, index) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(index)}
                onMouseEnter={() => setHoveredTab(index)}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                style={{
                  position: "relative",
                  padding: "8px 20px",
                  fontSize: "14px",
                  fontWeight: activeTab === index ? 500 : 400,
                  color:
                    activeTab === index
                      ? "rgba(255, 255, 255, 1)"
                      : "rgba(255, 255, 255, 0.5)",
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
            className="mx-auto max-w-4xl md:auto-rows-[20rem]"
            key={activeTab}
          >
            {tabs[activeTab].content.map((item, i) => (
              <BentoGridItem
                animationDelay={i * 0.03}
                className={cn("[&>p:text-lg]", item.className)}
                description={item.description}
                header={item.header}
                icon={item.icon}
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

const SkeletonOne = () => {
  const [layerPhase, setLayerPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayerPhase((prev) => (prev + 1) % 60);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Multiple protective layers wrapping around sensitive data
  const layers = [
    { size: 80, delay: 0 },
    { size: 100, delay: 0.15 },
    { size: 120, delay: 0.3 },
  ];

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-dot-white/[0.15] p-4">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Animated protective layers */}
        {layers.map((layer, index) => {
          const progress = (layerPhase + index * 20) % 60;
          const opacity =
            progress < 30
              ? 0.15 + (progress / 30) * 0.25
              : 0.4 - ((progress - 30) / 30) * 0.25;

          return (
            <motion.div
              animate={{
                opacity,
                scale: 1 + Math.sin((layerPhase + index * 20) * 0.1) * 0.08,
              }}
              className="absolute rounded-full border border-neutral-600"
              key={`layer-${index}`}
              style={{
                width: `${layer.size}px`,
                height: `${layer.size}px`,
              }}
              transition={{ duration: 0.2 }}
            />
          );
        })}

        {/* Center content - layered data protection */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          {/* Data icon stack showing multiple items being protected */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            {/* Background stacked documents */}
            <div className="absolute top-1 left-1 h-12 w-10 rounded-md border border-neutral-600 bg-neutral-800/60" />
            <div className="absolute top-0.5 left-0.5 h-12 w-10 rounded-md border border-neutral-600 bg-neutral-800/80" />

            {/* Main document with content preview */}
            <div className="relative z-10 flex h-12 w-10 flex-col gap-1 rounded-md border border-neutral-500 bg-neutral-900 p-1.5">
              <div className="h-1 w-full rounded-full bg-red-500" />
              <div className="h-1 w-4 rounded-full bg-red-500" />

              {/* Lock overlay showing protection */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                className="absolute inset-0 flex items-center justify-center rounded-md bg-neutral-900/60 backdrop-blur-[1px]"
                style={{ paddingTop: "14px" }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              >
                <IconLock className="h-4 w-4 text-red-500" />
              </motion.div>
            </div>
          </div>

          {/* Protection indicators */}
          <div
            className="flex items-center gap-1"
            style={{ marginTop: "-10px" }}
          >
            {Array.from({ length: 3 }).map((_, i) => {
              const dotProgress = (layerPhase - i * 10) % 60;
              const isActive = dotProgress < 30;

              return (
                <motion.div
                  animate={{
                    opacity: isActive ? 1 : 0.3,
                    scale: isActive ? 1 : 0.85,
                  }}
                  className="h-1 w-1 rounded-full bg-neutral-500"
                  key={`dot-${i}`}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </div>
        </div>

        {/* Floating protection badges at corners */}
        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            y: [-2, 2, -2],
          }}
          className="absolute top-0 left-0 rounded border border-neutral-700 bg-neutral-900/90 px-1.5 py-0.5"
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <span className="font-mono text-[7px] text-neutral-500">TLS</span>
        </motion.div>

        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            y: [2, -2, 2],
          }}
          className="absolute top-0 right-0 rounded border border-neutral-700 bg-neutral-900/90 px-1.5 py-0.5"
          transition={{
            duration: 3,
            delay: 1,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <span className="font-mono text-[7px] text-neutral-500">E2E</span>
        </motion.div>

        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            y: [2, -2, 2],
          }}
          className="absolute bottom-0 left-0 rounded border border-neutral-700 bg-neutral-900/90 px-1.5 py-0.5"
          transition={{
            duration: 3,
            delay: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <span className="font-mono text-[7px] text-neutral-500">AES</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

const SkeletonTwo = () => {
  const [wavePhase, setWavePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Create fragmented/shattered data blocks that represent anonymized transaction data
  const fragments = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    startX: 10 + (i % 4) * 22,
    startY: 20 + Math.floor(i / 4) * 20,
    endX: 50 + (Math.random() - 0.5) * 60,
    endY: 50 + (Math.random() - 0.5) * 60,
    rotation: Math.random() * 360,
  }));

  return (
    <motion.div className="relative flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-dot-white/[0.15] p-4">
      <div className="relative h-32 w-full max-w-sm">
        {/* Left side: Original transaction data as a grid */}
        <div className="-translate-y-1/2 absolute top-1/2 left-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  animate={{
                    opacity: wavePhase < 30 ? 1 : 0.3,
                    scale: wavePhase < 30 ? 1 : 0.95,
                  }}
                  className={`h-3 w-3 rounded-sm ${i === 1 || i === 3 ? "bg-red-500" : "bg-neutral-600"}`}
                  key={`block-0-${i}`}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  animate={{
                    opacity: wavePhase < 30 ? 1 : 0.3,
                    scale: wavePhase < 30 ? 1 : 0.95,
                  }}
                  className={`h-3 w-3 rounded-sm ${i === 0 || i === 2 ? "bg-red-500" : "bg-neutral-600"}`}
                  key={`block-1-${i}`}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  animate={{
                    opacity: wavePhase < 30 ? 1 : 0.3,
                    scale: wavePhase < 30 ? 1 : 0.95,
                  }}
                  className="h-3 w-3 rounded-sm bg-neutral-600"
                  key={`block-2-${i}`}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  animate={{
                    opacity: wavePhase < 30 ? 1 : 0.3,
                    scale: wavePhase < 30 ? 1 : 0.95,
                  }}
                  className="h-3 w-3 rounded-sm bg-neutral-600"
                  key={`block-3-${i}`}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </div>
          </div>
          <span className="mt-2 block font-mono text-[8px] text-neutral-500">
            Data
          </span>
        </div>

        {/* Center: Fragmentation/Anonymization effect */}
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
          style={{ marginTop: "-10px" }}
        >
          <svg className="h-28 w-28" viewBox="0 0 100 100">
            {/* Animated wave/distortion lines showing data scrambling */}
            {Array.from({ length: 5 }).map((_, i) => {
              const baseY = 30 + i * 10;
              const offset = Math.sin((wavePhase + i * 10) * 0.1) * 8;

              return (
                <motion.path
                  animate={{
                    opacity: wavePhase >= 25 && wavePhase <= 75 ? 0.4 : 0,
                  }}
                  d={`M 20 ${baseY + offset} Q 35 ${baseY - offset} 50 ${baseY + offset} T 80 ${baseY + offset}`}
                  fill="none"
                  key={`wave-${i}`}
                  stroke="#737373"
                  strokeWidth="1"
                  transition={{ duration: 0.3 }}
                />
              );
            })}

            {/* Shredding/fragmenting visual */}
            {fragments.map((frag) => {
              const progress = Math.max(0, Math.min(1, (wavePhase - 30) / 40));
              const x = frag.startX + (frag.endX - frag.startX) * progress;
              const y = frag.startY + (frag.endY - frag.startY) * progress;

              return (
                <motion.rect
                  animate={{
                    opacity:
                      wavePhase >= 30 && wavePhase <= 70 ? [0, 0.6, 0.3] : 0,
                    rotate: wavePhase >= 30 ? frag.rotation : 0,
                  }}
                  fill="#525252"
                  height="2"
                  key={`frag-${frag.id}`}
                  transition={{ duration: 0.8 }}
                  width="2"
                  x={x}
                  y={y}
                />
              );
            })}
          </svg>

          {/* Center icon showing anonymization */}
          <motion.div
            animate={{
              scale: wavePhase >= 25 && wavePhase <= 75 ? 1 : 0.8,
              opacity: wavePhase >= 25 && wavePhase <= 75 ? 1 : 0.3,
            }}
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
            transition={{ duration: 0.4 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/80 backdrop-blur-sm">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Right side: Anonymous output (question marks representing unknown data) */}
        <div className="-translate-y-1/2 absolute top-1/2 right-0">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                animate={{
                  opacity: wavePhase > 70 ? 1 : 0.3,
                  x: wavePhase > 70 ? 0 : -5,
                }}
                className="flex items-center gap-1.5"
                key={`output-${i}`}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded border border-neutral-700 bg-neutral-900">
                  <span className="font-mono text-[10px] text-neutral-500">
                    ?
                  </span>
                </div>
                <div className="h-1 w-8 rounded-full bg-neutral-800" />
              </motion.div>
            ))}
          </div>
          <span className="mt-2 block font-mono text-[8px] text-neutral-500">
            Anonymous
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonThree = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Circular workflow steps
  const steps = [
    { label: "Trigger", angle: 0 },
    { label: "Process", angle: 120 },
    { label: "Complete", angle: 240 },
  ];

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-dot-white/[0.15] p-4">
      <div className="relative h-28 w-28">
        {/* Circular progress track */}
        <svg className="-rotate-90 absolute inset-0" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="stroke-neutral-800"
            cx="50"
            cy="50"
            fill="none"
            r="40"
            strokeWidth="2"
          />

          {/* Animated progress circle */}
          <motion.circle
            animate={{
              strokeDashoffset: [251, 251 - (251 * progress) / 3],
            }}
            className="stroke-red-500"
            cx="50"
            cy="50"
            fill="none"
            r="40"
            strokeDasharray="251"
            strokeLinecap="round"
            strokeWidth="2"
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Workflow steps as dots on the circle */}
          {steps.map((step, index) => {
            const angleRad = (step.angle * Math.PI) / 180;
            const x = 50 + 40 * Math.cos(angleRad);
            const y = 50 + 40 * Math.sin(angleRad);
            const isActive =
              progress === index + 1 || (progress === 0 && index === 2);

            return (
              <g key={step.label}>
                {/* Dot */}
                <motion.circle
                  animate={{
                    r: isActive ? 4 : 2.5,
                    fill: isActive ? "#a3a3a3" : "#737373",
                  }}
                  cx={x}
                  cy={y}
                  transition={{ duration: 0.3 }}
                />

                {/* Pulse when active */}
                {isActive && (
                  <motion.circle
                    animate={{
                      r: [4, 8],
                      opacity: [0.6, 0],
                    }}
                    cx={x}
                    cy={y}
                    fill="#a3a3a3"
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Center automation icon */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
          <motion.div
            animate={{
              rotate: progress * 120,
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-neutral-700 bg-neutral-900"
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <svg
              className="h-6 w-6 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-1.06 4.46m-1.039-7.877l.548-2.937M18.5 12l-1.5.667M6.5 12l-1.5-.667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Step labels positioned around the circle */}
        {steps.map((step, index) => {
          const angleRad = (step.angle * Math.PI) / 180;
          const labelRadius = 65;
          const x = 50 + labelRadius * Math.cos(angleRad);
          const y = 50 + labelRadius * Math.sin(angleRad);
          const isActive =
            progress === index + 1 || (progress === 0 && index === 2);

          return (
            <div
              className="absolute"
              key={`label-${step.label}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  scale: isActive ? 1 : 0.9,
                }}
                className="whitespace-nowrap font-mono text-[9px] text-neutral-500"
                transition={{ duration: 0.3 }}
              >
                {step.label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const SkeletonFour = () => {
  const [flowPhase, setFlowPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowPhase((prev) => (prev + 1) % 100);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Create task items that flow from left to right
  const tasks = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 8,
  }));

  return (
    <motion.div className="relative flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-dot-white/[0.15] p-4">
      <div className="relative flex w-full items-center justify-between gap-6 px-4">
        {/* Left: Repetitive tasks stacking up */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-20 w-24">
            {/* Stack of repetitive task cards */}
            {Array.from({ length: 4 }).map((_, i) => {
              const shouldShow = (flowPhase + i * 15) % 100 < 25;

              return (
                <motion.div
                  animate={{
                    opacity: shouldShow ? [0, 1, 1, 0.3] : 0.3,
                    y: shouldShow ? [10, 0, 0, 0] : 0,
                    scale: shouldShow ? [0.9, 1, 1, 0.95] : 0.95,
                  }}
                  className="absolute left-0 flex h-14 w-20 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/80"
                  key={`task-stack-${i}`}
                  style={{
                    top: `${i * 4}px`,
                    left: `${i * 2}px`,
                  }}
                  transition={{ duration: 1.2 }}
                >
                  <div className="flex flex-col gap-1 p-2">
                    <div className="h-1 w-12 rounded-full bg-neutral-600" />
                    <div className="h-1 w-8 rounded-full bg-neutral-700" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <span className="mt-1 font-mono text-[8px] text-neutral-500">
            Repetitive
          </span>
        </div>

        {/* Center: Automation engine with flowing particles */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
          <div className="relative h-20 w-full">
            {/* Horizontal flow path */}
            <svg
              className="h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 200 80"
            >
              {/* Flow lines */}
              <motion.path
                animate={{
                  strokeDashoffset: [0, -40],
                }}
                d="M 0 40 L 200 40"
                fill="none"
                stroke="#404040"
                strokeDasharray="4 4"
                strokeWidth="1"
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />

              {/* Flowing task particles */}
              {tasks.map((task) => {
                const progress = ((flowPhase + task.delay) % 100) / 100;
                const x = progress * 200;
                const opacity = progress < 0.1 || progress > 0.9 ? 0 : 1;

                return (
                  <motion.g key={`particle-${task.id}`}>
                    <motion.circle
                      animate={{
                        opacity,
                      }}
                      cx={x}
                      cy="40"
                      fill="#737373"
                      r="2.5"
                      transition={{ duration: 0.3 }}
                    />
                    {/* Trailing glow */}
                    <motion.circle
                      animate={{
                        opacity: opacity * 0.3,
                      }}
                      cx={x - 6}
                      cy="40"
                      fill="#525252"
                      r="1.5"
                      transition={{ duration: 0.3 }}
                    />
                  </motion.g>
                );
              })}
            </svg>

            {/* Central automation icon */}
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-neutral-600 bg-neutral-900"
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {/* Lightning bolt - automation symbol */}
                <svg
                  className="h-7 w-7 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          <span className="font-mono text-[8px] text-neutral-500">
            Automated
          </span>
        </div>

        {/* Right: Clean organized output */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => {
              const completionPhase = (flowPhase - 50 + i * 10) % 100;
              const isCompleted = completionPhase < 30;

              return (
                <motion.div
                  animate={{
                    opacity: isCompleted ? 1 : 0.3,
                    scale: isCompleted ? 1 : 0.9,
                    x: isCompleted ? 0 : -8,
                  }}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-1.5"
                  key={`output-${i}`}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  {/* Checkmark */}
                  <motion.div
                    animate={{
                      scale: isCompleted ? [0.8, 1.2, 1] : 0.8,
                      opacity: isCompleted ? 1 : 0.4,
                    }}
                    className="flex h-3 w-3 items-center justify-center rounded-full bg-neutral-700"
                    transition={{ duration: 0.4 }}
                  >
                    <svg
                      className="h-2 w-2 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                  {/* Task line */}
                  <div className="h-1 w-10 rounded-full bg-neutral-700" />
                </motion.div>
              );
            })}
          </div>
          <span className="mt-1 font-mono text-[8px] text-neutral-500">
            Completed
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonFiveApp = () => {
  const [dataIndex, setDataIndex] = useState(0);
  const DATA_CYCLE_INTERVAL = 1800;
  const TOTAL_DATA_ITEMS = 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setDataIndex((prev) => (prev + 1) % TOTAL_DATA_ITEMS);
    }, DATA_CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const dataItems = [
    { label: "Messages", icon: "message" },
    { label: "Files", icon: "file" },
    { label: "Keys", icon: "key" },
    { label: "Tokens", icon: "coin" },
  ];

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-dot-white/[0.15] p-4">
      {/* Center - Wallet as storage */}
      <div className="relative flex flex-col items-center">
        {/* Wallet container */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          className="relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-neutral-600/40 bg-neutral-800/50"
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          {/* Wallet icon */}
          <svg
            className="relative z-10 h-10 w-10"
            fill="none"
            stroke="url(#wallet-gradient)"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <defs>
              <linearGradient
                id="wallet-gradient"
                x1="0%"
                x2="100%"
                y1="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <path
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Data items flowing into wallet - positioned around it */}
          {dataItems.map((item, index) => {
            const isActive = dataIndex === index;
            // Position items in a circle around the wallet
            const angle =
              (index / TOTAL_DATA_ITEMS) * 2 * Math.PI - Math.PI / 2;
            const radius = 50;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                animate={{
                  opacity: isActive ? [0, 1, 0.7, 0] : 0.5,
                  scale: isActive ? [0.8, 1, 1, 0.8] : 0.85,
                  x: isActive ? [x, 0] : x,
                  y: isActive ? [y, 0] : y,
                }}
                className="absolute flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900/80 px-2 py-0.5"
                key={`data-${index}`}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                {item.icon === "message" && (
                  <svg
                    className="h-3 w-3 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.icon === "file" && (
                  <svg
                    className="h-3 w-3 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.icon === "key" && (
                  <svg
                    className="h-3 w-3 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.icon === "coin" && (
                  <svg
                    className="h-3 w-3 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <span className="font-mono text-[9px] text-neutral-500">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

const SkeletonFive = () => {
  const [activeConnection, setActiveConnection] = useState(0);
  const CONNECTION_INTERVAL = 2000;
  const NUM_CONTRACTS = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveConnection((prev) => (prev + 1) % NUM_CONTRACTS);
    }, CONNECTION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const contracts = [
    { color: "from-neutral-500 to-neutral-600", yPercent: 15 },
    { color: "from-neutral-500 to-neutral-600", yPercent: 50 },
    { color: "from-neutral-500 to-neutral-600", yPercent: 85 },
  ];

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 items-center justify-between gap-4 rounded-xl bg-dot-white/[0.15] p-4">
      {/* Left side - Smart Contracts */}
      <div className="flex flex-col justify-center gap-5">
        {contracts.map((contract, index) => (
          <motion.div
            animate={{
              scale: activeConnection === index ? 1.1 : 1,
              opacity: activeConnection === index ? 1 : 0.5,
            }}
            className="flex items-center gap-2"
            key={`contract-${index}`}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${contract.color} shadow-lg`}
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {activeConnection === index && (
              <motion.span
                animate={{ opacity: [0, 1] }}
                className="font-mono text-[10px] text-neutral-400"
                transition={{ duration: 0.3 }}
              >
                Contract {index + 1}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Connection Lines with flowing particles */}
      <div className="relative flex-1 self-stretch">
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            {contracts.map((_, index) => (
              <linearGradient
                id={`gradient-${index}`}
                key={`gradient-${index}`}
                x1="0%"
                x2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={
                    index === 0
                      ? "#a3a3a3"
                      : index === 1
                        ? "#a3a3a3"
                        : "#a3a3a3"
                  }
                />
                <stop offset="100%" stopColor="#737373" />
              </linearGradient>
            ))}
          </defs>
          {contracts.map((contract, index) => {
            const isActive = activeConnection === index;
            const startY = 15 + index * 35; // 15, 50, 85
            // For middle line, adjust control point to create visible curve
            const controlY = index === 1 ? startY - 5 : startY;
            return (
              <g key={`line-${index}`}>
                {/* Connection line */}
                <path
                  d={`M 0 ${startY} Q 50 ${controlY} 100 50`}
                  fill="none"
                  opacity={isActive ? 1 : 0.4}
                  stroke={`url(#gradient-${index})`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {/* Flowing particle */}
                {isActive && (
                  <circle fill="#ef4444" r="2.5">
                    <animateMotion
                      dur="1.5s"
                      path={`M 0 ${startY} Q 50 ${controlY} 100 50`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Right side - AI Agent */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        className="relative"
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        }}
      >
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-400/20 to-neutral-500/20 blur-xl"
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-neutral-600/40 bg-neutral-700/10 shadow-lg">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="mt-1 block text-center font-mono text-[10px] text-neutral-400">
          Loyal Agent
        </span>
      </motion.div>
    </motion.div>
  );
};

const SkeletonNine = () => {
  const [activeStep, setActiveStep] = useState(0);
  const CYCLE_INTERVAL = 2500;
  const TOTAL_STEPS = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % TOTAL_STEPS);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-dot-white/[0.15] p-4">
      <div className="flex w-full flex-col gap-1">
        {/* Nodes and flow lines row */}
        <div className="flex w-full items-center justify-between gap-2">
          {/* Input Node */}
          <motion.div
            animate={{
              scale: activeStep === 0 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-neutral-600/40 bg-neutral-700/10">
              <IconMessage className="h-6 w-6 text-neutral-400" />
            </div>
          </motion.div>

          {/* Flow line 1 */}
          <div className="relative h-0.5 flex-1 bg-neutral-700">
            <motion.div
              animate={{
                scaleX: activeStep >= 1 ? 1 : 0,
              }}
              className="absolute inset-0 origin-left bg-gradient-to-r from-neutral-500 to-neutral-600"
              transition={{ duration: 0.6 }}
            />
            {/* Flowing particle */}
            {activeStep === 0 && (
              <motion.div
                animate={{ x: ["0%", "100%"] }}
                className="-translate-y-1/2 absolute top-1/2 h-2 w-2 rounded-full bg-red-500 shadow-lg"
                transition={{ duration: 0.8, ease: "linear" }}
              />
            )}
          </div>

          {/* Process Node */}
          <motion.div
            animate={{
              scale: activeStep === 1 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-neutral-600/40 bg-neutral-700/10">
              <motion.div
                animate={{
                  rotate: activeStep === 1 ? 360 : 0,
                }}
                transition={{
                  duration: 1,
                  ease: "linear",
                  repeat: activeStep === 1 ? Number.POSITIVE_INFINITY : 0,
                }}
              >
                <IconTableColumn
                  className={`h-6 w-6 ${activeStep === 1 ? "text-red-500" : "text-neutral-400"}`}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Flow line 2 */}
          <div className="relative h-0.5 flex-1 bg-neutral-700">
            <motion.div
              animate={{
                scaleX: activeStep >= 2 ? 1 : 0,
              }}
              className="absolute inset-0 origin-left bg-gradient-to-r from-neutral-500 to-neutral-600"
              transition={{ duration: 0.6 }}
            />
            {/* Flowing particle */}
            {activeStep === 1 && (
              <motion.div
                animate={{ x: ["0%", "100%"] }}
                className="-translate-y-1/2 absolute top-1/2 h-2 w-2 rounded-full bg-red-500 shadow-lg"
                transition={{ duration: 0.8, ease: "linear" }}
              />
            )}
          </div>

          {/* Output Node */}
          <motion.div
            animate={{
              scale: activeStep === 2 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-neutral-600/40 bg-neutral-700/10">
              <motion.div
                animate={{
                  scale: activeStep === 2 ? [0, 1] : 1,
                  rotate: activeStep === 2 ? [0, 360] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <svg
                  className="h-6 w-6 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Labels row */}
        <div className="flex w-full items-center justify-between gap-2">
          <span className="w-12 text-center font-mono text-[10px] text-neutral-400">
            Input
          </span>
          <div className="flex-1" />
          <span className="w-12 text-center font-mono text-[10px] text-neutral-400">
            Process
          </span>
          <div className="flex-1" />
          <span className="w-12 text-center font-mono text-[10px] text-neutral-400">
            Done
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonEight = () => {
  const [stage, setStage] = useState<"idle" | "sending" | "sent">("idle");
  const CYCLE_DURATION = 4000;
  const IDLE_DURATION = 1000;
  const SENDING_DURATION = 1500;

  useEffect(() => {
    const sequence = async () => {
      setStage("idle");
      await new Promise((resolve) => setTimeout(resolve, IDLE_DURATION));
      setStage("sending");
      await new Promise((resolve) => setTimeout(resolve, SENDING_DURATION));
      setStage("sent");
      await new Promise((resolve) =>
        setTimeout(resolve, CYCLE_DURATION - IDLE_DURATION - SENDING_DURATION)
      );
    };

    sequence();
    const interval = setInterval(sequence, CYCLE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div className="flex h-full min-h-[6rem] w-full flex-1 flex-col justify-between rounded-xl bg-dot-white/[0.15] px-4 pt-4 pb-3">
      {/* Sender bubble */}
      <motion.div
        animate={{
          opacity: stage === "idle" ? 0 : 1,
          y: stage === "idle" ? -10 : 0,
        }}
        className="flex items-start gap-2"
        transition={{ duration: 0.4 }}
      >
        <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-600" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] text-neutral-400">@alice</span>
          <div className="rounded-2xl rounded-tl-sm border border-neutral-600/30 bg-neutral-700/10 px-2.5 py-1.5">
            <span className="text-neutral-300 text-xs">Send 5 SOL</span>
          </div>
        </div>
      </motion.div>

      {/* Animated coin/token traveling */}
      <div className="relative flex h-8 items-center justify-center">
        <motion.div
          animate={{
            x: stage === "idle" ? -60 : stage === "sending" ? 0 : 60,
            opacity: stage === "idle" || stage === "sent" ? 0 : 1,
            scale: stage === "sending" ? [1, 1.3, 1] : 1,
          }}
          className="absolute"
          transition={{
            duration: stage === "sending" ? 1 : 0.4,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <div className="relative">
            {/* Coin */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-lg">
              <span className="font-bold text-white text-xs">5</span>
            </div>
            {/* Privacy particles/shimmer */}
            <motion.div
              animate={{
                opacity: stage === "sending" ? [0.3, 0.8, 0.3] : 0,
                scale: stage === "sending" ? [1, 1.5, 1] : 1,
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/30 to-red-500/30 blur-md"
              transition={{
                duration: 0.8,
                repeat: stage === "sending" ? Number.POSITIVE_INFINITY : 0,
                repeatType: "loop",
              }}
            />
          </div>
        </motion.div>

        {/* Privacy shield indicator */}
        <motion.div
          animate={{
            opacity: stage === "sending" ? 1 : 0,
            scale: stage === "sending" ? 1 : 0.8,
          }}
          className="flex items-center gap-1 rounded-full border border-neutral-600/40 bg-neutral-700/10 px-2 py-0.5"
          transition={{ duration: 0.3 }}
        >
          <IconLock className="h-3 w-3 text-red-500" />
          <span className="font-mono text-[10px] text-neutral-400">
            Private
          </span>
        </motion.div>
      </div>

      {/* Receiver bubble */}
      <motion.div
        animate={{
          opacity: stage === "sent" ? 1 : 0,
          y: stage === "sent" ? 0 : 10,
        }}
        className="ml-auto flex items-start gap-2"
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[11px] text-neutral-400">@bob</span>
          <div className="rounded-2xl rounded-tr-sm border border-neutral-600/30 bg-neutral-700/10 px-2.5 py-1.5">
            <span className="text-neutral-300 text-xs">Received 5 SOL</span>
          </div>
        </div>
        <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-600" />
      </motion.div>
    </motion.div>
  );
};

const SkeletonSeven = () => {
  const [isSecured, setIsSecured] = useState(false);
  const CYCLE_INTERVAL = 3500;
  const PARTICLE_COUNT = 6;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSecured((prev) => !prev);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Scattered positions form a circle around the shield
  const getScatteredPosition = (index: number) => {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
    const radius = 45;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <motion.div className="relative flex h-full min-h-[6rem] w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-dot-white/[0.15]">
      {/* Central Shield Container */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Glowing shield background */}
        <motion.div
          animate={{
            scale: isSecured ? [1, 1.15, 1] : 1,
            opacity: isSecured ? [0.4, 0.6, 0.4] : 0.2,
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/20 to-red-500/20 blur-xl"
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
        />

        {/* Shield shape */}
        <motion.div
          animate={{
            scale: isSecured ? 1 : 0.9,
          }}
          className="relative z-10 flex h-16 w-16 items-center justify-center"
          transition={{ duration: 0.6 }}
        >
          {/* Shield border with gradient */}
          <svg
            className="absolute inset-0 h-full w-full"
            fill="none"
            viewBox="0 0 64 64"
          >
            <motion.path
              animate={{
                opacity: isSecured ? 1 : 0.5,
                pathLength: isSecured ? 1 : 0.8,
              }}
              d="M32 4 L52 12 L52 28 Q52 44 32 60 Q12 44 12 28 L12 12 Z"
              stroke="url(#shield-gradient)"
              strokeWidth="2"
              transition={{ duration: 0.8 }}
            />
            <defs>
              <linearGradient
                id="shield-gradient"
                x1="0%"
                x2="100%"
                y1="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgb(163, 163, 163)" />
                <stop offset="100%" stopColor="rgb(115, 115, 115)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lock icon in center */}
          <motion.div
            animate={{
              scale: isSecured ? 1 : 0.7,
              opacity: isSecured ? 1 : 0.4,
            }}
            className="z-20 text-red-500"
            transition={{ duration: 0.5 }}
          >
            <IconLock className="h-6 w-6" />
          </motion.div>
        </motion.div>

        {/* Data particles flowing */}
        {Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
          const scattered = getScatteredPosition(index);
          return (
            <motion.div
              animate={
                isSecured
                  ? {
                      x: 0,
                      y: 0,
                      scale: 0.3,
                      opacity: 0.8,
                    }
                  : {
                      x: scattered.x,
                      y: scattered.y,
                      scale: 1,
                      opacity: 0.4,
                    }
              }
              className="absolute h-2 w-2 rounded-full bg-gradient-to-br from-red-400 to-red-500"
              key={`particle-${index}`}
              style={{
                boxShadow: isSecured
                  ? "0 0 8px rgba(239, 68, 68, 0.4)"
                  : "0 0 4px rgba(239, 68, 68, 0.2)",
              }}
              transition={{
                duration: 1.2,
                delay: index * 0.08,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            />
          );
        })}
      </div>

      {/* Status text */}
      <motion.div
        animate={{ opacity: isSecured ? 1 : 0.6 }}
        className="-translate-x-1/2 absolute bottom-4 left-1/2 whitespace-nowrap rounded-full border border-neutral-700/50 bg-neutral-900/70 px-3 py-1 backdrop-blur-sm"
        transition={{ duration: 0.4 }}
      >
        <span className="font-mono text-neutral-300 text-xs">
          {isSecured ? "Your Data, Your Rules" : "Collecting..."}
        </span>
      </motion.div>
    </motion.div>
  );
};

const SkeletonSix = () => {
  const ANIMATION_CYCLE_LENGTH = 4;
  const ANIMATION_INTERVAL_MS = 1500;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => (prev + 1) % ANIMATION_CYCLE_LENGTH);
    }, ANIMATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const COIN_DELAY_PER_INDEX = 0.15;
  const COIN_ANIMATION_DURATION = 0.4;
  const PRICE_SCALE_MAX = 1.2;
  const PRICE_ANIMATION_DURATION = 0.3;
  const BAR_ANIMATION_DURATION = 0.6;
  const PRICE_PER_QUERY = 0.001;

  return (
    <motion.div
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col justify-between rounded-xl bg-dot-white/[0.15] p-2"
      initial="initial"
    >
      {/* Animated coins dropping */}
      <div className="flex flex-row items-start justify-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            animate={
              index <= count
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: -20, opacity: 0, scale: 0.8 }
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neutral-400 via-neutral-500 to-neutral-600 shadow-lg"
            key={`coin-${index}`}
            transition={{
              delay: index * COIN_DELAY_PER_INDEX,
              duration: COIN_ANIMATION_DURATION,
            }}
          >
            <div className="h-5 w-5 rounded-full border-2 border-neutral-300/40" />
          </motion.div>
        ))}
      </div>

      {/* Payment amount display */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2">
          <span className="font-mono text-neutral-400 text-xs">Query</span>
          <motion.span
            animate={{ scale: [1, PRICE_SCALE_MAX, 1] }}
            className="font-mono font-semibold text-red-500"
            key={count}
            transition={{ duration: PRICE_ANIMATION_DURATION }}
          >
            ${(count + 1) * PRICE_PER_QUERY}
          </motion.span>
        </div>

        {/* Progress bars showing accumulation */}
        <div className="space-y-1.5">
          {[0.33, 0.66, 1].map((width, idx) => (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-neutral-800"
              key={`bar-${idx}`}
            >
              <motion.div
                animate={idx <= count ? { scaleX: width } : { scaleX: 0 }}
                className={`h-full origin-left ${idx === 1 ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-neutral-400 to-neutral-500"}`}
                transition={{ duration: BAR_ANIMATION_DURATION }}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

type BentoVisualConfig = {
  header: ReactNode;
  className: string;
  icon: ReactNode;
};

const bentoVisuals: Record<BentoItemVisualKey, BentoVisualConfig> = {
  cardOne: {
    header: <SkeletonOne />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  cardTwo: {
    header: <SkeletonTwo />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  },
  cardThree: {
    header: <SkeletonThree />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  cardFour: {
    header: <SkeletonFour />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  cardFive: {
    header: <SkeletonFive />,
    className: "md:col-span-2",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  },
  cardFiveApp: {
    header: <SkeletonFiveApp />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  },
  cardSix: {
    header: <SkeletonSix />,
    className: "md:col-span-1",
    icon: <IconCoin className="h-4 w-4 text-neutral-500" />,
  },
  cardSeven: {
    header: <SkeletonSeven />,
    className: "md:col-span-1",
    icon: <IconLock className="h-4 w-4 text-neutral-500" />,
  },
  cardEight: {
    header: <SkeletonEight />,
    className: "md:col-span-1",
    icon: <IconMessage className="h-4 w-4 text-neutral-500" />,
  },
  cardNine: {
    header: <SkeletonNine />,
    className: "md:col-span-1",
    icon: <IconGitBranch className="h-4 w-4 text-neutral-500" />,
  },
};

const tabs = bentoTabs.map((tab) => ({
  label: tab.label,
  content: tab.items.map((item) => {
    const visuals = bentoVisuals[item.visualKey];

    return {
      ...visuals,
      title: item.title,
      description: <span className="text-sm">{item.description}</span>,
    };
  }),
}));

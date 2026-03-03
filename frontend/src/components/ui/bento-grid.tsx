import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "./glowing-effect";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
      className
    )}
  >
    {children}
  </div>
);

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  animationDelay = 0,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  animationDelay?: number;
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={cn("group/bento row-span-1", className)}
    exit={{ opacity: 0, y: 20, scale: 0.95 }}
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    transition={{
      duration: 0.25,
      delay: animationDelay,
      ease: [0.4, 0, 0.2, 1],
    }}
  >
    <div className="relative h-full rounded-2xl">
      <GlowingEffect
        blur={0}
        borderWidth={3}
        disabled={true}
        glow={true}
        inactiveZone={0.01}
        proximity={64}
        spread={40}
      />
      <div
        className="relative flex h-full flex-col justify-between space-y-4 overflow-hidden rounded-2xl p-4 transition duration-200"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        {header}
        <div className="transition duration-200 group-hover/bento:translate-x-2">
          {icon}
          <div className="mt-2 mb-2 font-medium font-sans text-white/90">
            {title}
          </div>
          <div className="font-normal font-sans text-white/50 text-xs">
            {description}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "mx-auto grid max-w-7xl grid-cols-1 gap-5 md:auto-rows-[360px] md:grid-cols-3",
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
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: "#F5F5F5",
        borderRadius: "20px",
      }}
    >
      {/* Placeholder area for future animated images */}
      <div className="flex-1">{header}</div>
      {/* Text content at the bottom */}
      <div
        style={{
          padding: "20px 32px 20px 20px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "20px",
            fontWeight: 500,
            lineHeight: "24px",
            color: "#000",
            fontFeatureSettings: "'liga' off, 'clig' off",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: "rgba(60, 60, 67, 0.6)",
            fontFeatureSettings: "'liga' off, 'clig' off",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  </motion.div>
);

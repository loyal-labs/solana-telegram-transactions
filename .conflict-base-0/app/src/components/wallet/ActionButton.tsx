import React from "react";

export type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: ActionButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center justify-center gap-2 min-w-0 overflow-hidden rounded-2xl ${disabled ? "opacity-40" : ""} group`}
    >
      <div
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-150 group-active:scale-95 group-active:bg-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          mixBlendMode: "lighten",
        }}
      >
        <div className="text-white">
          {React.cloneElement(
            icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
            { size: 28, strokeWidth: 1.5 }
          )}
        </div>
      </div>
      <span className="text-[13px] text-white/60 leading-4">{label}</span>
    </button>
  );
}

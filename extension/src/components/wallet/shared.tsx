import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="px-5 py-2">
      <div className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-4">
        <Search className="shrink-0 text-gray-400" size={24} />
        <input
          className="flex-1 border-none bg-transparent font-sans text-base leading-5 text-white outline-none placeholder:text-gray-500"
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </div>
  );
}

export function SubViewHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const [backHovered, setBackHovered] = useState(false);

  return (
    <div className="flex items-center justify-between p-2">
      <button
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none transition-colors"
        onClick={onBack}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{
          background: backHovered
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(255, 255, 255, 0.08)",
        }}
        type="button"
      >
        <ArrowLeft className="text-gray-300" size={24} />
      </button>
      <span className="font-sans text-lg font-semibold leading-7 text-white">
        {title}
      </span>
      {/* Invisible spacer to keep title centered */}
      <div className="h-9 w-9" />
    </div>
  );
}

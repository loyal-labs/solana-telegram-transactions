import type { CSSProperties } from "react";

const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 0",
};

const svgStyle: CSSProperties = {
  width: 80,
  height: 64,
  animation: "shield-spin 1.5s ease-in-out infinite",
};

export function ShieldSpinner() {
  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes shield-spin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(0.95); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
      <svg
        width="80"
        height="64"
        viewBox="0 0 35 28"
        fill="none"
        style={svgStyle}
      >
        <path
          d="M5.24998 24.4999L0 12.25H15.75V0L22.7499 12.25L24.4999 0L34.9999 27.9999L5.24998 24.4999Z"
          fill="#F93844"
        />
        <path
          d="M19.369 15.141C22.2645 15.2927 24.5052 17.45 24.3737 19.9595L13.8881 19.41C14.0196 16.9005 16.4735 14.9892 19.369 15.141Z"
          fill="white"
        />
        <mask id="shield-eye-mask" maskUnits="userSpaceOnUse" x="13" y="15" width="12" height="5">
          <path
            d="M19.3693 15.141C22.2648 15.2927 24.5054 17.45 24.3739 19.9595L13.8883 19.41C14.0199 16.9005 16.4737 14.9892 19.3693 15.141Z"
            fill="white"
          />
        </mask>
        <g mask="url(#shield-eye-mask)">
          <circle cx="19.2498" cy="17.4126" r="2.36249" fill="black" />
        </g>
      </svg>
    </div>
  );
}

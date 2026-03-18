import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

const font = "var(--font-geist-sans), sans-serif";
const secondary = "rgba(60, 60, 67, 0.6)";

export function Settings({ onBack }: { onBack: () => void }) {
  const { network, setNetwork, publicKey, lock } = useWalletContext();
  const [lockHovered, setLockHovered] = useState(false);

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#3C3C43",
          }}
          type="button"
        >
          <ArrowLeft size={24} />
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "28px",
            color: "#000",
          }}
        >
          Settings
        </span>
        <div style={{ width: "36px" }} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Wallet info */}
        {truncatedKey && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontFamily: font,
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: "16px",
                color: secondary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Wallet
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "20px",
                color: "#000",
              }}
            >
              {truncatedKey}
            </span>
          </div>
        )}

        {/* Network toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontFamily: font,
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: "16px",
              color: secondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Network
          </span>
          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "rgba(0, 0, 0, 0.04)",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            {(["mainnet", "devnet"] as const).map((net) => (
              <button
                key={net}
                type="button"
                onClick={() => void setNetwork(net)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: "20px",
                  background: network === net ? "#fff" : "transparent",
                  color: network === net ? "#000" : secondary,
                  boxShadow:
                    network === net
                      ? "0 1px 3px rgba(0, 0, 0, 0.08)"
                      : "none",
                  transition:
                    "background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                {net === "mainnet" ? "Mainnet" : "Devnet"}
              </button>
            ))}
          </div>
        </div>

        {/* Connect external wallet */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontFamily: font,
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: "16px",
              color: secondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            External Wallet
          </span>
          <button
            type="button"
            onClick={() => {
              browser.tabs.create({
                url: browser.runtime.getURL("/connect.html"),
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              cursor: "pointer",
              background: "transparent",
              fontFamily: font,
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "20px",
              color: "#000",
              transition: "background 0.15s ease",
            }}
          >
            <ExternalLink size={16} style={{ color: secondary }} />
            Connect External Wallet
          </button>
        </div>

        {/* Lock wallet */}
        <button
          type="button"
          onClick={lock}
          onMouseEnter={() => setLockHovered(true)}
          onMouseLeave={() => setLockHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: lockHovered
              ? "rgba(255, 59, 48, 0.12)"
              : "rgba(255, 59, 48, 0.08)",
            fontFamily: font,
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
            color: "#FF3B30",
            transition: "background 0.15s ease",
          }}
        >
          <Lock size={16} />
          Lock Wallet
        </button>

        {/* Version */}
        <div style={{ textAlign: "center", paddingTop: "8px" }}>
          <span
            style={{
              fontFamily: font,
              fontSize: "12px",
              lineHeight: "16px",
              color: "rgba(60, 60, 67, 0.3)",
            }}
          >
            Loyal Extension v0.0.1
          </span>
        </div>
      </div>
    </div>
  );
}

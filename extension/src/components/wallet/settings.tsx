import { ArrowLeft, Check, Copy, Eye, EyeOff, Lock } from "lucide-react";
import { useCallback, useState } from "react";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

const font = "var(--font-geist-sans), sans-serif";
const secondary = "rgba(60, 60, 67, 0.6)";

export function Settings({ onBack }: { onBack: () => void }) {
  const { network, setNetwork, publicKey, lock, getSecretKey } = useWalletContext();
  const [lockHovered, setLockHovered] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyPrivateKey = useCallback(() => {
    const sk = getSecretKey();
    if (!sk) return;
    const json = JSON.stringify(Array.from(sk));
    void navigator.clipboard.writeText(json);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }, [getSecretKey]);

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

        {/* Export private key */}
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
            Export
          </span>
          {!showPrivateKey ? (
            <button
              type="button"
              onClick={() => setShowPrivateKey(true)}
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
              <Eye size={16} style={{ color: secondary }} />
              Show Private Key
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "rgba(255, 59, 48, 0.06)",
                borderRadius: "12px",
                padding: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: font,
                  fontSize: "12px",
                  lineHeight: "16px",
                  color: "#FF3B30",
                  textAlign: "center",
                }}
              >
                Never share your private key. Anyone with it has full access to your wallet.
              </span>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.04)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000",
                  wordBreak: "break-all",
                  maxHeight: "80px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(Array.from(getSecretKey() ?? []))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleCopyPrivateKey}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 0",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: "#000",
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "16px",
                    color: "#fff",
                    transition: "background 0.15s ease",
                  }}
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(false)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(0, 0, 0, 0.04)",
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "16px",
                    color: "#000",
                    transition: "background 0.15s ease",
                  }}
                >
                  Hide
                </button>
              </div>
            </div>
          )}
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

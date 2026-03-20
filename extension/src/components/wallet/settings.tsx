import { ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, Copy, Eye, Globe, KeyRound, Lock, Plus, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";
import { autoLockTimeout } from "~/src/lib/storage";

const font = "var(--font-geist-sans), sans-serif";
const secondary = "rgba(60, 60, 67, 0.6)";
const chevronColor = "rgba(60, 60, 67, 0.3)";
const sectionBg = "#EBEBEB";
const sectionRadius = "16px";

// ---------------------------------------------------------------------------
// Reusable row component — matches app ProfileCell pattern
// ---------------------------------------------------------------------------

function SettingsRow({
  icon,
  title,
  detail,
  onClick,
  destructive,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  detail?: string;
  onClick?: () => void;
  destructive?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "0 16px",
        background: "transparent",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        transition: "background 0.1s ease",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {icon && (
        <div style={{ display: "flex", alignItems: "center", paddingRight: "10px", color: destructive ? "#FF3B30" : "rgba(0,0,0,0.6)" }}>
          {icon}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          minWidth: 0,
          borderBottom: "0.5px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "20px",
            color: destructive ? "#FF3B30" : "#000",
          }}
        >
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "12px", flexShrink: 0 }}>
          {detail && (
            <span
              style={{
                fontFamily: font,
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "20px",
                color: secondary,
              }}
            >
              {detail}
            </span>
          )}
          {children}
          {onClick && !children && (
            <ChevronRight size={14} style={{ color: chevronColor }} />
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper — matches app SettingsSection
// ---------------------------------------------------------------------------

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <span
          style={{
            fontFamily: font,
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            color: secondary,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            paddingLeft: "16px",
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          background: sectionBg,
          borderRadius: sectionRadius,
          paddingTop: "1px",
          paddingBottom: "1px",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control for network / auto-lock
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        background: "rgba(0, 0, 0, 0.06)",
        borderRadius: "8px",
        padding: "2px",
        margin: "4px 16px 8px",
      }}
    >
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontFamily: font,
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            background: value === opt.value ? "#fff" : "transparent",
            color: value === opt.value ? "#000" : secondary,
            boxShadow: value === opt.value ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
            transition: "all 0.15s ease",
            minWidth: 0,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings component
// ---------------------------------------------------------------------------

export function Settings({ onBack }: { onBack: () => void }) {
  const { network, setNetwork, publicKey, lock, resetWallet, getSecretKey } = useWalletContext();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [resetAction, setResetAction] = useState<"create" | "import" | null>(null);
  const [lockTimeout, setLockTimeout] = useState(15);

  useEffect(() => {
    void autoLockTimeout.getValue().then(setLockTimeout);
  }, []);

  const handleCopyPrivateKey = useCallback(() => {
    const sk = getSecretKey();
    if (!sk) return;
    const hex = Array.from(sk).map((b) => b.toString(16).padStart(2, "0")).join("");
    void navigator.clipboard.writeText(hex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }, [getSecretKey]);

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#F5F5F5" }}>
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

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 12px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* ── Network ── */}
        <Section label="Network">
          <SegmentedControl
            options={[
              { value: "mainnet" as const, label: "Mainnet" },
              { value: "devnet" as const, label: "Devnet" },
            ]}
            value={network}
            onChange={(v) => void setNetwork(v)}
          />
        </Section>

        {/* ── Wallet ── */}
        <Section label="Wallet">
          {truncatedKey && (
            <SettingsRow
              icon={<Globe size={18} />}
              title="Address"
              detail={truncatedKey}
              onClick={() => {
                if (publicKey) {
                  void navigator.clipboard.writeText(publicKey);
                  setCopiedAddress(true);
                  setTimeout(() => setCopiedAddress(false), 1500);
                }
              }}
            >
              {copiedAddress
                ? <Check size={14} style={{ color: "#34C759" }} />
                : <Copy size={14} style={{ color: chevronColor }} />
              }
            </SettingsRow>
          )}
          <SettingsRow
            icon={<Eye size={18} />}
            title="Private Key"
            onClick={() => setShowPrivateKey(!showPrivateKey)}
          >
            {showPrivateKey
              ? <ChevronUp size={14} style={{ color: chevronColor }} />
              : <ChevronDown size={14} style={{ color: chevronColor }} />
            }
          </SettingsRow>
          {showPrivateKey && (
            <div
              style={{
                margin: "0 12px 8px",
                background: "rgba(255, 59, 48, 0.06)",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                {Array.from(getSecretKey() ?? []).map((b) => b.toString(16).padStart(2, "0")).join("")}
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
          <SettingsRow
            icon={<Plus size={18} />}
            title="Create New Wallet"
            onClick={() => setResetAction("create")}
            destructive
          />
          <SettingsRow
            icon={<KeyRound size={18} />}
            title="Import Wallet"
            onClick={() => setResetAction("import")}
            destructive
          />

          {/* Confirmation card */}
          <div
            style={{
              maxHeight: resetAction ? "200px" : "0",
              opacity: resetAction ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                margin: "0 12px 8px",
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid rgba(255, 59, 48, 0.2)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: font,
                  fontSize: "13px",
                  fontWeight: 500,
                  lineHeight: "18px",
                  color: "#FF3B30",
                  textAlign: "center",
                }}
              >
                Your current wallet will be erased. Without an exported key you will lose access forever.
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    void resetWallet();
                    setResetAction(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: "rgba(255, 59, 48, 0.12)",
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "16px",
                    color: "#FF3B30",
                    transition: "background 0.15s ease",
                  }}
                >
                  I'm 100% sure
                </button>
                <button
                  type="button"
                  onClick={() => setResetAction(null)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    borderRadius: "10px",
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
                  Nevermind
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Extension ── */}
        <Section label="Extension">
          <SettingsRow
            icon={<Lock size={18} />}
            title="Lock Now"
            onClick={lock}
            destructive
          />
          <div style={{ padding: "0 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "0.5px solid rgba(0, 0, 0, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Timer size={18} style={{ color: "rgba(0,0,0,0.6)" }} />
                <span
                  style={{
                    fontFamily: font,
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "#000",
                  }}
                >
                  Auto-Lock
                </span>
              </div>
            </div>
          </div>
          <SegmentedControl
            options={[
              { value: 5, label: "5m" },
              { value: 15, label: "15m" },
              { value: 30, label: "30m" },
              { value: 60, label: "1h" },
              { value: 0, label: "Never" },
            ]}
            value={lockTimeout}
            onChange={(v) => {
              setLockTimeout(v);
              void autoLockTimeout.setValue(v);
            }}
          />
        </Section>

        {/* Version */}
        <div style={{ textAlign: "center", paddingTop: "4px" }}>
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

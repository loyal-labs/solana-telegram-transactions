import { useCallback, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Shield,
  Wallet,
} from "lucide-react";
import type { SubView, SwapMode, SwapToken } from "@loyal-labs/wallet-core/types";
import { LOYL_TOKEN } from "@loyal-labs/wallet-core/types";
import { useWalletContext, WalletProvider } from "./wallet-provider";

import { PortfolioContent } from "./portfolio-content";
import { SendContent } from "./send-content";
import { ReceiveContent } from "./receive-content";
import { SwapContent } from "./swap-content";
import { ShieldContent, SwapShieldTabs } from "./shield-content";

import { AllTokensView } from "./all-tokens-view";
import { AllActivityView } from "./all-activity-view";
import { TokenSelectView } from "./token-select-view";
import { TransactionDetailView } from "./transaction-detail-view";

// ---------------------------------------------------------------------------
// Default token constants
// ---------------------------------------------------------------------------

const SOL_TOKEN: SwapToken = {
  mint: "So11111111111111111111111111111111111111112",
  symbol: "SOL",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  price: 0,
  balance: 0,
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "portfolio", label: "Portfolio", Icon: Wallet },
  { id: "send", label: "Send", Icon: ArrowUpRight },
  { id: "receive", label: "Receive", Icon: ArrowDownLeft },
  { id: "swap", label: "Swap", Icon: ArrowLeftRight },
  { id: "shield", label: "Shield", Icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---------------------------------------------------------------------------
// 3-layer sliding navigation
// ---------------------------------------------------------------------------

function layerStyle(
  layer: number,
  activeLayer: number,
): React.CSSProperties {
  if (layer > activeLayer) {
    // Off-screen to the right
    return {
      transform: "translateX(100%)",
      opacity: 0,
      pointerEvents: "none",
      transition: "transform 300ms ease, opacity 200ms ease",
    };
  }
  if (layer === activeLayer) {
    // Fully visible
    return {
      transform: "translateX(0)",
      opacity: 1,
      transition: "transform 300ms ease, opacity 200ms ease",
    };
  }
  // Behind the active layer — shift slightly left
  return {
    transform: "translateX(-8%)",
    opacity: 0.3,
    pointerEvents: "none",
    transition: "transform 300ms ease, opacity 200ms ease",
  };
}

function getActiveLayer(subView: SubView): number {
  if (subView === null) return 0;
  if (
    typeof subView === "object" &&
    subView.type === "transaction"
  ) {
    return 2;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Create / Import wallet screen
// ---------------------------------------------------------------------------

function CreateWalletScreen() {
  const { createWallet, importWallet } = useWalletContext();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [mode, setMode] = useState<"create" | "import">("create");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createWallet(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const bytes = new Uint8Array(JSON.parse(secretKeyInput));
      setError(null);
      setLoading(true);
      await importWallet(bytes, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid secret key or import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "0 24px",
        gap: "24px",
      }}
    >
      <Wallet size={48} style={{ color: "#F9363C" }} />
      <span
        style={{
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "20px",
          fontWeight: 600,
          lineHeight: "28px",
          color: "#000",
        }}
      >
        Loyal Wallet
      </span>

      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
        <button
          type="button"
          onClick={() => { setMode("create"); setError(null); }}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
            background: mode === "create" ? "#000" : "rgba(0, 0, 0, 0.04)",
            color: mode === "create" ? "#fff" : "#000",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => { setMode("import"); setError(null); }}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
            background: mode === "import" ? "#000" : "rgba(0, 0, 0, 0.04)",
            color: mode === "import" ? "#fff" : "#000",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          Import
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 16px",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "14px",
            lineHeight: "20px",
            color: "#000",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 16px",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "14px",
            lineHeight: "20px",
            color: "#000",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {mode === "import" && (
          <textarea
            placeholder="Secret key (JSON byte array)"
            value={secretKeyInput}
            onChange={(e) => setSecretKeyInput(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              background: "rgba(0, 0, 0, 0.04)",
              border: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "#000",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        )}

        {error && (
          <p
            style={{
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "13px",
              lineHeight: "16px",
              color: "#FF3B30",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={mode === "create" ? handleCreate : handleImport}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "9999px",
            border: "none",
            cursor: loading ? "default" : "pointer",
            background: loading ? "#CCCDCD" : "#000",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: "#fff",
            textAlign: "center",
            transition: "background 0.15s ease",
          }}
        >
          {loading
            ? "Working..."
            : mode === "create"
              ? "Create Wallet"
              : "Import Wallet"}
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(0, 0, 0, 0.1)" }} />
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "13px",
            lineHeight: "16px",
            color: "rgba(60, 60, 67, 0.4)",
          }}
        >
          or
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(0, 0, 0, 0.1)" }} />
      </div>

      {/* Connect External Wallet */}
      <button
        type="button"
        onClick={() => {
          browser.tabs.create({
            url: browser.runtime.getURL("/connect.html"),
          });
        }}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "9999px",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          cursor: "pointer",
          background: "transparent",
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "20px",
          color: "#000",
          textAlign: "center",
          transition: "background 0.15s ease",
        }}
      >
        Connect External Wallet
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unlock screen
// ---------------------------------------------------------------------------

function UnlockScreen() {
  const { unlock, publicKey } = useWalletContext();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      await unlock(password);
    } catch {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "0 24px",
        gap: "24px",
      }}
    >
      <Wallet size={48} style={{ color: "#F9363C" }} />
      <span
        style={{
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "20px",
          fontWeight: 600,
          lineHeight: "28px",
          color: "#000",
        }}
      >
        Welcome Back
      </span>
      {truncatedKey && (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "20px",
            color: "rgba(60, 60, 67, 0.6)",
          }}
        >
          {truncatedKey}
        </span>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 16px",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "14px",
            lineHeight: "20px",
            color: "#000",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p
            style={{
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "13px",
              lineHeight: "16px",
              color: "#FF3B30",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleUnlock}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "9999px",
            border: "none",
            cursor: loading ? "default" : "pointer",
            background: loading ? "#CCCDCD" : "#000",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: "#fff",
            textAlign: "center",
            transition: "background 0.15s ease",
          }}
        >
          {loading ? "Unlocking..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wallet interface (unlocked state)
// ---------------------------------------------------------------------------

function WalletInterface() {
  const { balanceHidden, toggleBalanceHidden, publicKey } = useWalletContext();

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>("portfolio");
  const [subView, setSubView] = useState<SubView>(null);
  const [swapMode, setSwapMode] = useState<SwapMode>("swap");
  const [fromToken, setFromToken] = useState<SwapToken>(SOL_TOKEN);
  const [toToken, setToToken] = useState<SwapToken>(LOYL_TOKEN);
  const [sendToken, setSendToken] = useState<SwapToken>(SOL_TOKEN);
  const [shieldToken, setShieldToken] = useState<SwapToken>(SOL_TOKEN);

  const activeLayer = getActiveLayer(subView);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setSubView(null);
  }, []);

  const goBack = useCallback(() => {
    setSubView((current) => {
      if (current === null) return null;
      if (typeof current === "object" && current.type === "transaction") {
        return current.from === "allActivity" ? "allActivity" : "allTokens";
      }
      return null;
    });
  }, []);

  const handleNavigate = useCallback((view: SubView) => {
    setSubView(view);
  }, []);

  const handleDone = useCallback(() => {
    setSubView(null);
  }, []);

  // In the extension, "close" goes back to portfolio (no sidebar to dismiss)
  const handleClose = useCallback(() => {
    setActiveTab("portfolio");
    setSubView(null);
  }, []);

  // TODO: Wire real wallet data via useWalletData + useSolanaWalletDataClient
  // once the SolanaWalletDataClient dependency chain is available in the extension.
  // For now, provide empty/loading placeholder data so navigation and component
  // rendering work end-to-end.
  const walletAddress = publicKey;
  const isLoading = false;
  const balanceWhole = "$0";
  const balanceFraction = ".00";
  const balanceSolLabel = "0 SOL";
  const walletLabel = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "No account";
  const tokenRows: import("@loyal-labs/wallet-core/types").TokenRow[] = [];
  const allTokenRows: import("@loyal-labs/wallet-core/types").TokenRow[] = [];
  const activityRows: import("@loyal-labs/wallet-core/types").ActivityRow[] = [];
  const allActivityRows: import("@loyal-labs/wallet-core/types").ActivityRow[] = [];
  const transactionDetails: Record<string, import("@loyal-labs/wallet-core/types").TransactionDetail> = {};

  // Convert allTokenRows to SwapToken[] for token-select views
  const swapTokens: SwapToken[] = allTokenRows.map((row) => ({
    mint: row.id,
    symbol: row.symbol,
    icon: row.icon,
    price: 0,
    balance: 0,
  }));

  // Tab content with real components
  const renderTabContent = () => {
    switch (activeTab) {
      case "portfolio":
        return (
          <PortfolioContent
            activityRows={activityRows}
            balanceFraction={balanceFraction}
            balanceSolLabel={balanceSolLabel}
            balanceWhole={balanceWhole}
            isBalanceHidden={balanceHidden}
            isLoading={isLoading}
            onBalanceHiddenChange={() => void toggleBalanceHidden()}
            onNavigate={handleNavigate}
            tokenRows={tokenRows}
            allTokenRows={allTokenRows}
            transactionDetails={transactionDetails}
            walletAddress={walletAddress}
            walletLabel={walletLabel}
          />
        );
      case "send":
        return (
          <SendContent
            token={sendToken}
            onClose={handleClose}
            onNavigate={handleNavigate}
            onDone={handleDone}
          />
        );
      case "receive":
        return (
          <ReceiveContent
            walletAddress={walletAddress}
            onClose={handleClose}
          />
        );
      case "swap":
        return (
          <SwapContent
            fromToken={fromToken}
            toToken={toToken}
            onFromTokenChange={setFromToken}
            onToTokenChange={setToToken}
            onClose={handleClose}
            onNavigate={handleNavigate}
            onDone={handleDone}
            swapMode={swapMode}
            onSwapModeChange={setSwapMode}
          />
        );
      case "shield":
        return (
          <ShieldContent
            token={shieldToken}
            onTokenChange={setShieldToken}
            onClose={handleClose}
            onNavigate={handleNavigate}
            onDone={handleDone}
            securedBalance={0}
            swapMode={swapMode}
            onSwapModeChange={setSwapMode}
          />
        );
    }
  };

  // Sub-view content (layer 1)
  const renderSubView = () => {
    if (subView === null) return null;

    if (typeof subView === "string") {
      if (subView === "allTokens") {
        return (
          <AllTokensView
            tokens={allTokenRows}
            isBalanceHidden={balanceHidden}
            onBack={goBack}
            onClose={handleClose}
          />
        );
      }
      if (subView === "allActivity") {
        return (
          <AllActivityView
            activities={allActivityRows}
            details={transactionDetails}
            isBalanceHidden={balanceHidden}
            onBack={goBack}
            onClose={handleClose}
            onNavigate={handleNavigate}
          />
        );
      }
      return null;
    }

    if (subView.type === "tokenSelect") {
      return (
        <TokenSelectView
          title={subView.field === "from" ? "Pay with" : "Receive"}
          currentToken={subView.field === "from" ? fromToken : toToken}
          onSelect={(token) => {
            if (subView.field === "from") {
              setFromToken(token);
            } else {
              setToToken(token);
            }
            setSubView(null);
          }}
          onBack={goBack}
          onClose={handleClose}
          tokens={swapTokens}
        />
      );
    }

    if (subView.type === "sendTokenSelect") {
      return (
        <TokenSelectView
          title="Send token"
          currentToken={sendToken}
          onSelect={(token) => {
            setSendToken(token);
            setSubView(null);
          }}
          onBack={goBack}
          onClose={handleClose}
          tokens={swapTokens}
        />
      );
    }

    if (subView.type === "shieldTokenSelect") {
      return (
        <TokenSelectView
          title="Shield token"
          currentToken={shieldToken}
          onSelect={(token) => {
            setShieldToken(token);
            setSubView(null);
          }}
          onBack={goBack}
          onClose={handleClose}
          tokens={swapTokens}
        />
      );
    }

    return null;
  };

  // Transaction detail content (layer 2)
  const renderTransactionDetail = () => {
    if (
      subView === null ||
      typeof subView === "string" ||
      subView.type !== "transaction"
    ) {
      return null;
    }
    return (
      <TransactionDetailView
        detail={subView.detail}
        onBack={goBack}
        onClose={handleClose}
      />
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Navigation layers container */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Layer 0 — main tab content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: "#F5F5F5",
            ...layerStyle(0, activeLayer),
          }}
        >
          {renderTabContent()}
        </div>

        {/* Layer 1 — sub-views */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: "#F5F5F5",
            ...layerStyle(1, activeLayer),
          }}
        >
          {renderSubView()}
        </div>

        {/* Layer 2 — transaction detail */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: "#F5F5F5",
            ...layerStyle(2, activeLayer),
          }}
        >
          {renderTransactionDetail()}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          background: "#F5F5F5",
          padding: "8px 0",
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "color 0.15s ease",
                color: isActive ? "#F9363C" : "rgba(60, 60, 67, 0.4)",
              }}
            >
              <Icon size={20} />
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  lineHeight: "12px",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root WalletApp component
// ---------------------------------------------------------------------------

function WalletAppInner() {
  const { state } = useWalletContext();

  if (state === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(0, 0, 0, 0.1)",
            borderTopColor: "#3C3C43",
            borderRadius: "9999px",
            animation: "sidebar-spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (state === "noWallet") return <CreateWalletScreen />;
  if (state === "locked") return <UnlockScreen />;
  return <WalletInterface />;
}

export default function WalletApp() {
  return (
    <WalletProvider>
      <style>{`
        @keyframes sidebar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F5F5F5",
          color: "#000",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
      >
        <WalletAppInner />
      </div>
    </WalletProvider>
  );
}

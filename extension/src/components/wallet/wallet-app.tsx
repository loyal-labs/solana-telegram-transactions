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
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
      <Wallet className="w-12 h-12 text-purple-400" />
      <h1 className="text-xl font-bold text-white">Loyal Wallet</h1>

      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={() => { setMode("create"); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "create"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => { setMode("import"); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "import"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Import
        </button>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
        />

        {mode === "import" && (
          <textarea
            placeholder="Secret key (JSON byte array)"
            value={secretKeyInput}
            onChange={(e) => setSecretKeyInput(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        )}

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={mode === "create" ? handleCreate : handleImport}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors"
        >
          {loading
            ? "Working..."
            : mode === "create"
              ? "Create Wallet"
              : "Import Wallet"}
        </button>
      </div>
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
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
      <Wallet className="w-12 h-12 text-purple-400" />
      <h1 className="text-xl font-bold text-white">Welcome Back</h1>
      {truncatedKey && (
        <p className="text-gray-400 text-sm font-mono">{truncatedKey}</p>
      )}

      <div className="flex flex-col gap-3 w-full">
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
        />

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleUnlock}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors"
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
            onNavigate={handleNavigate}
            onDone={handleDone}
          />
        );
      case "receive":
        return <ReceiveContent />;
      case "swap":
        return (
          <SwapContent
            fromToken={fromToken}
            toToken={toToken}
            onFromTokenChange={setFromToken}
            onToTokenChange={setToToken}
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
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation layers container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Layer 0 — main tab content */}
        <div
          className="absolute inset-0 flex flex-col"
          style={layerStyle(0, activeLayer)}
        >
          {renderTabContent()}
        </div>

        {/* Layer 1 — sub-views */}
        <div
          className="absolute inset-0 flex flex-col bg-gray-900"
          style={layerStyle(1, activeLayer)}
        >
          {renderSubView()}
        </div>

        {/* Layer 2 — transaction detail */}
        <div
          className="absolute inset-0 flex flex-col bg-gray-900"
          style={layerStyle(2, activeLayer)}
        >
          {renderTransactionDetail()}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="flex items-center justify-around border-t border-gray-800 bg-gray-900 py-2">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                isActive ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
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
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
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
      <div className="w-full h-full bg-gray-900 text-white">
        <WalletAppInner />
      </div>
    </WalletProvider>
  );
}

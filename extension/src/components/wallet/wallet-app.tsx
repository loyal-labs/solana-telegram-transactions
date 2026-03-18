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
  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>("portfolio");
  const [subView, setSubView] = useState<SubView>(null);
  const [swapMode, _setSwapMode] = useState<SwapMode>("swap");
  const [_fromToken, _setFromToken] = useState<SwapToken | null>(null);
  const [_toToken, _setToToken] = useState<SwapToken>(LOYL_TOKEN);

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

  // Tab content (placeholder divs for Tasks 20-25)
  const renderTabContent = () => {
    switch (activeTab) {
      case "portfolio":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Portfolio Content</p>
          </div>
        );
      case "send":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Send Content</p>
          </div>
        );
      case "receive":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Receive Content</p>
          </div>
        );
      case "swap":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Swap Content (mode: {swapMode})</p>
          </div>
        );
      case "shield":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Shield Content</p>
          </div>
        );
    }
  };

  // Sub-view content (layer 1)
  const renderSubView = () => {
    if (subView === null) return null;
    if (typeof subView === "string") {
      return (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={goBack}
            className="text-purple-400 text-sm px-4 py-2 self-start"
          >
            &larr; Back
          </button>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">
              {subView === "allTokens" && "All Tokens View"}
              {subView === "allActivity" && "All Activity View"}
            </p>
          </div>
        </div>
      );
    }
    if (subView.type === "tokenSelect") {
      return (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={goBack}
            className="text-purple-400 text-sm px-4 py-2 self-start"
          >
            &larr; Back
          </button>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">
              Token Select ({subView.field})
            </p>
          </div>
        </div>
      );
    }
    if (subView.type === "sendTokenSelect") {
      return (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={goBack}
            className="text-purple-400 text-sm px-4 py-2 self-start"
          >
            &larr; Back
          </button>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Send Token Select</p>
          </div>
        </div>
      );
    }
    if (subView.type === "shieldTokenSelect") {
      return (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={goBack}
            className="text-purple-400 text-sm px-4 py-2 self-start"
          >
            &larr; Back
          </button>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Shield Token Select</p>
          </div>
        </div>
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
      <div className="flex-1 flex flex-col">
        <button
          type="button"
          onClick={goBack}
          className="text-purple-400 text-sm px-4 py-2 self-start"
        >
          &larr; Back
        </button>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">Transaction Detail</p>
        </div>
      </div>
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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Connection } from "@solana/web3.js";
import type { WalletSigner } from "@loyal-labs/wallet-core/types";
import { createKeypairSigner } from "~/src/lib/keypair-signer";
import {
  clearStoredKeypair,
  generateKeypair,
  getStoredPublicKey,
  hasStoredKeypair,
  importKeypair,
  loadKeypair,
} from "~/src/lib/keypair-storage";
import {
  isBalanceHidden as isBalanceHiddenStorage,
  isWalletUnlocked as isWalletUnlockedStorage,
  lastActivityAt as lastActivityAtStorage,
  networkSelection,
} from "~/src/lib/storage";

// ---------------------------------------------------------------------------
// RPC endpoints (inlined from @loyal-labs/solana-rpc — not available as a
// direct extension dependency yet)
// ---------------------------------------------------------------------------

type Network = "mainnet" | "devnet";

const RPC_ENDPOINTS: Record<Network, string> = {
  mainnet: "https://guendolen-nvqjc4-fast-mainnet.helius-rpc.com",
  devnet: "https://aurora-o23cd4-fast-devnet.helius-rpc.com",
};

function getRpcUrl(network: Network): string {
  return RPC_ENDPOINTS[network];
}

// ---------------------------------------------------------------------------
// Wallet state
// ---------------------------------------------------------------------------

export type WalletState = "loading" | "noWallet" | "locked" | "unlocked";

interface WalletContextValue {
  /** Current wallet lifecycle state */
  state: WalletState;
  /** Active signer — only available when state === "unlocked" */
  signer: WalletSigner | null;
  /** Solana RPC connection for the active network */
  connection: Connection;
  /** Currently selected network */
  network: Network;
  /** Whether the portfolio balance display is hidden */
  balanceHidden: boolean;
  /** Stored public key (available once keypair exists, even if locked) */
  publicKey: string | null;

  // Actions
  createWallet: (password: string) => Promise<void>;
  importWallet: (secretKey: Uint8Array, password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  /** Wipe stored keypair and return to the create wallet screen */
  resetWallet: () => Promise<void>;
  setNetwork: (network: Network) => Promise<void>;
  toggleBalanceHidden: () => Promise<void>;
  /** Returns the secret key as a byte array. Only available when unlocked. */
  getSecretKey: () => Uint8Array | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>("loading");
  const [signer, setSigner] = useState<WalletSigner | null>(null);
  const [network, setNetworkState] = useState<Network>("mainnet");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  // Keep the active keypair in memory so we can rebuild the signer on network change
  const [activeKeypair, setActiveKeypair] = useState<Awaited<ReturnType<typeof loadKeypair>>>(null);

  // Derive connection from network
  const connection = useMemo(
    () => new Connection(getRpcUrl(network), "confirmed"),
    [network],
  );

  // Rebuild signer whenever connection or active keypair changes
  useEffect(() => {
    if (activeKeypair && state === "unlocked") {
      setSigner(createKeypairSigner(activeKeypair, connection));
    }
  }, [connection, activeKeypair, state]);

  // -----------------------------------------------------------------------
  // Initialise: read persisted storage on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [hasKeypair, storedPk, net, hidden] = await Promise.all([
        hasStoredKeypair(),
        getStoredPublicKey(),
        networkSelection.getValue(),
        isBalanceHiddenStorage.getValue(),
      ]);

      if (cancelled) return;

      setPublicKey(storedPk);
      setNetworkState(net);
      setBalanceHidden(hidden);
      setState(hasKeypair ? "locked" : "noWallet");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Watch storage changes (reactive across popup / side panel)
  // -----------------------------------------------------------------------

  useEffect(() => {
    const unwatchNetwork = networkSelection.watch((value) => {
      setNetworkState(value);
    });
    const unwatchBalance = isBalanceHiddenStorage.watch((value) => {
      setBalanceHidden(value);
    });
    // Background worker may set this to false on idle/timeout
    const unwatchUnlocked = isWalletUnlockedStorage.watch((value) => {
      if (!value && state === "unlocked") {
        setSigner(null);
        setActiveKeypair(null);
        setState("locked");
      }
    });

    return () => {
      unwatchNetwork();
      unwatchBalance();
      unwatchUnlocked();
    };
  }, [state]);

  // -----------------------------------------------------------------------
  // Activity heartbeat — throttled, updates last-activity for auto-lock
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (state !== "unlocked") return;
    let lastSent = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastSent < 30_000) return; // throttle to once per 30s
      lastSent = now;
      void lastActivityAtStorage.setValue(now);
    };
    const events = ["click", "keydown", "scroll", "mousemove"] as const;
    for (const e of events) document.addEventListener(e, onActivity, { passive: true });
    return () => {
      for (const e of events) document.removeEventListener(e, onActivity);
    };
  }, [state]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const buildSigner = useCallback(
    (keypair: Awaited<ReturnType<typeof loadKeypair>>) => {
      if (!keypair) return;
      const walletSigner = createKeypairSigner(keypair, connection);
      setSigner(walletSigner);
      setActiveKeypair(keypair);
      setPublicKey(keypair.publicKey.toBase58());
      setState("unlocked");
      void isWalletUnlockedStorage.setValue(true);
      void lastActivityAtStorage.setValue(Date.now());
    },
    [connection],
  );

  const createWallet = useCallback(
    async (password: string) => {
      const keypair = await generateKeypair(password);
      buildSigner(keypair);
    },
    [buildSigner],
  );

  const importWallet = useCallback(
    async (secretKey: Uint8Array, password: string) => {
      const keypair = await importKeypair(secretKey, password);
      buildSigner(keypair);
    },
    [buildSigner],
  );

  const unlock = useCallback(
    async (password: string) => {
      const keypair = await loadKeypair(password);
      if (!keypair) {
        throw new Error("Invalid password or no stored keypair");
      }
      buildSigner(keypair);
    },
    [buildSigner],
  );

  const lock = useCallback(() => {
    setSigner(null);
    setActiveKeypair(null);
    setState("locked");
    void isWalletUnlockedStorage.setValue(false);
  }, []);

  const resetWallet = useCallback(async () => {
    setSigner(null);
    setActiveKeypair(null);
    setPublicKey(null);
    await clearStoredKeypair();
    await isWalletUnlockedStorage.setValue(false);
    setState("noWallet");
  }, []);

  const setNetwork = useCallback(async (net: Network) => {
    await networkSelection.setValue(net);
    setNetworkState(net);
  }, []);

  const toggleBalanceHidden = useCallback(() => {
    setBalanceHidden((prev) => {
      const next = !prev;
      void isBalanceHiddenStorage.setValue(next);
      return next;
    });
  }, []);

  const getSecretKey = useCallback((): Uint8Array | null => {
    if (!activeKeypair) return null;
    return activeKeypair.secretKey;
  }, [activeKeypair]);

  const value = useMemo<WalletContextValue>(
    () => ({
      state,
      signer,
      connection,
      network,
      balanceHidden,
      publicKey,
      createWallet,
      importWallet,
      unlock,
      lock,
      resetWallet,
      setNetwork,
      toggleBalanceHidden,
      getSecretKey,
    }),
    [
      state,
      signer,
      connection,
      network,
      balanceHidden,
      publicKey,
      createWallet,
      importWallet,
      unlock,
      lock,
      resetWallet,
      setNetwork,
      toggleBalanceHidden,
      getSecretKey,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

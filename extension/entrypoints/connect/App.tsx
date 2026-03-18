import { useMemo, useEffect, useState, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

// ---------------------------------------------------------------------------
// Solana RPC endpoint (mainnet via public endpoint; adapter only needs it for
// ConnectionProvider — actual transactions happen elsewhere)
// ---------------------------------------------------------------------------
const SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

// ---------------------------------------------------------------------------
// Inner component — reacts to wallet connection
// ---------------------------------------------------------------------------

function ConnectInner() {
  const { publicKey, connected, disconnect } = useWallet();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPublicKey = useCallback(async (key: string) => {
    try {
      await browser.runtime.sendMessage({
        type: "WALLET_CONNECTED",
        publicKey: key,
      });
      setSent(true);
      // Auto-close the tab after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to send key to extension",
      );
    }
  }, []);

  useEffect(() => {
    if (connected && publicKey && !sent) {
      void sendPublicKey(publicKey.toBase58());
    }
  }, [connected, publicKey, sent, sendPublicKey]);

  if (sent) {
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>&#10003;</div>
        <h2 style={styles.heading}>Wallet Connected</h2>
        <p style={styles.mono}>{publicKey?.toBase58()}</p>
        <p style={styles.subtext}>
          Public key sent to extension. This tab will close automatically.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <p style={{ ...styles.subtext, color: "#FF3B30" }}>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setSent(false);
            void disconnect();
          }}
          style={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Loyal Wallet</h1>
      <p style={styles.subtext}>
        Connect an external Solana wallet to use with the Loyal extension.
      </p>
      <WalletMultiButton
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          borderRadius: "9999px",
          fontSize: "16px",
          height: "48px",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App — sets up Solana wallet adapter providers
// ---------------------------------------------------------------------------

export default function App() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    [],
  );

  return (
    <div style={styles.page}>
      <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            <ConnectInner />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F5F5F5",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    margin: 0,
    padding: "24px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    background: "#fff",
    borderRadius: "20px",
    padding: "48px 40px",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    lineHeight: "32px",
    color: "#000",
    margin: 0,
  },
  heading: {
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: "28px",
    color: "#000",
    margin: 0,
  },
  subtext: {
    fontSize: "14px",
    lineHeight: "20px",
    color: "rgba(60, 60, 67, 0.6)",
    textAlign: "center" as const,
    margin: 0,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: "13px",
    lineHeight: "18px",
    color: "rgba(60, 60, 67, 0.6)",
    wordBreak: "break-all" as const,
    textAlign: "center" as const,
    margin: 0,
  },
  successIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "9999px",
    background: "#34C759",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 700,
  },
  retryButton: {
    padding: "12px 32px",
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    background: "#000",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "20px",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
};

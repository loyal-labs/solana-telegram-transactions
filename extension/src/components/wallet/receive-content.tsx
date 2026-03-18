import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useState } from "react";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

const SOLANA_ICON_URL =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

export function ReceiveContent() {
  const { publicKey } = useWalletContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!publicKey) return;
    void navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicKey]);

  const address = publicKey ?? "";

  return (
    <div className="flex flex-1 flex-col">
      {/* Body */}
      <div className="flex flex-1 flex-col items-center overflow-auto px-6">
        {/* Solana icon + warning */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <img
            alt="Solana"
            className="h-[52px] w-[52px] rounded-full"
            src={SOLANA_ICON_URL}
          />
          <p className="max-w-[318px] text-center font-sans text-sm leading-5 text-gray-400">
            Use to receive tokens on the Solana network only. Other assets will
            be lost forever.
          </p>
        </div>

        {/* QR Code card */}
        <div className="mt-6 flex w-full max-w-[280px] flex-col items-center gap-4 rounded-2xl bg-white p-8">
          {address ? (
            <QRCodeSVG
              bgColor="transparent"
              fgColor="#000"
              level="M"
              size={192}
              value={address}
            />
          ) : (
            <div className="h-48 w-48 rounded-lg bg-gray-200" />
          )}
          <p className="break-all text-center font-sans text-[13px] leading-[18px] text-gray-500">
            {address || "No wallet connected"}
          </p>
        </div>
      </div>

      {/* Copy Address button */}
      <div className="px-5 py-4">
        <button
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-purple-600 px-4 py-3 transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!address}
          onClick={handleCopy}
          type="button"
        >
          {copied ? (
            <Check className="text-white" size={20} />
          ) : (
            <Copy className="text-white" size={20} />
          )}
          <span className="font-sans text-base leading-5 text-white">
            {copied ? "Copied!" : "Copy Address"}
          </span>
        </button>
      </div>
    </div>
  );
}

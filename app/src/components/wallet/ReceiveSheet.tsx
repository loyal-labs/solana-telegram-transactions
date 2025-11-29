"use client";

import { hapticFeedback, shareURL } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { X } from "lucide-react";
import QRCodeLib from "qrcode";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getWalletPublicKey } from "@/lib/solana/wallet/wallet-details";

// Custom QR Code with rounded finder patterns
interface StyledQRCodeProps {
  value: string;
  size: number;
  logoSrc: string;
  logoSize: number;
}

function StyledQRCode({ value, size, logoSrc, logoSize }: StyledQRCodeProps) {
  const [modules, setModules] = useState<boolean[][]>([]);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qr = QRCodeLib.create(value, { errorCorrectionLevel: "M" });
        const data = qr.modules.data;
        const moduleCount = qr.modules.size;

        const matrix: boolean[][] = [];
        for (let row = 0; row < moduleCount; row++) {
          const rowData: boolean[] = [];
          for (let col = 0; col < moduleCount; col++) {
            rowData.push(data[row * moduleCount + col] === 1);
          }
          matrix.push(rowData);
        }
        setModules(matrix);
      } catch (error) {
        console.error("Failed to generate QR code", error);
      }
    };
    void generateQR();
  }, [value]);

  if (modules.length === 0) return null;

  const moduleCount = modules.length;
  const cellSize = size / moduleCount;
  const finderSize = 7; // Finder patterns are 7x7 modules
  const cornerRadius = cellSize * 1.5; // Rounded corner radius for finder patterns

  // Check if a cell is part of a finder pattern
  const isFinderPattern = (row: number, col: number) => {
    // Top-left finder
    if (row < finderSize && col < finderSize) return true;
    // Top-right finder
    if (row < finderSize && col >= moduleCount - finderSize) return true;
    // Bottom-left finder
    if (row >= moduleCount - finderSize && col < finderSize) return true;
    return false;
  };

  // Check if cell is part of the center logo area
  const centerStart = Math.floor((moduleCount - logoSize / cellSize) / 2);
  const centerEnd = Math.ceil((moduleCount + logoSize / cellSize) / 2);
  const isCenterArea = (row: number, col: number) => {
    return row >= centerStart && row < centerEnd && col >= centerStart && col < centerEnd;
  };

  // Render finder pattern with rounded corners using mask for proper cutout
  const renderFinderPattern = (startRow: number, startCol: number, id: string) => {
    const x = startCol * cellSize;
    const y = startRow * cellSize;
    const outerSize = finderSize * cellSize;
    const middleOffset = cellSize;
    const middleSize = 5 * cellSize;
    const innerOffset = 2 * cellSize;
    const innerSize = 3 * cellSize;
    const middleRadius = cornerRadius * 0.6;
    const innerRadius = cornerRadius * 0.4;

    return (
      <g key={`finder-${id}`}>
        <defs>
          <mask id={`finder-mask-${id}`}>
            {/* White = visible, Black = cut out */}
            <rect
              x={x}
              y={y}
              width={outerSize}
              height={outerSize}
              rx={cornerRadius}
              ry={cornerRadius}
              fill="white"
            />
            <rect
              x={x + middleOffset}
              y={y + middleOffset}
              width={middleSize}
              height={middleSize}
              rx={middleRadius}
              ry={middleRadius}
              fill="black"
            />
            <rect
              x={x + innerOffset}
              y={y + innerOffset}
              width={innerSize}
              height={innerSize}
              rx={innerRadius}
              ry={innerRadius}
              fill="white"
            />
          </mask>
        </defs>
        <rect
          x={x}
          y={y}
          width={outerSize}
          height={outerSize}
          fill="white"
          mask={`url(#finder-mask-${id})`}
        />
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Render regular modules (not part of finder patterns or center) */}
      {modules.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (!cell) return null;
          if (isFinderPattern(rowIndex, colIndex)) return null;
          if (isCenterArea(rowIndex, colIndex)) return null;

          return (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill="white"
            />
          );
        })
      )}

      {/* Render finder patterns with rounded corners */}
      {renderFinderPattern(0, 0, "tl")}
      {renderFinderPattern(0, moduleCount - finderSize, "tr")}
      {renderFinderPattern(moduleCount - finderSize, 0, "bl")}

      {/* Center logo */}
      <image
        href={logoSrc}
        x={(size - logoSize) / 2}
        y={(size - logoSize) / 2}
        width={logoSize}
        height={logoSize}
      />
    </svg>
  );
}

export type ReceiveSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  walletAddress?: string;
};

const COPIED_RESET_TIMEOUT = 2000;

// Copy icon component
const CopyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.8333 10.5H11.6667C10.3779 10.5 9.33333 11.5446 9.33333 12.8333V21C9.33333 22.2887 10.3779 23.3333 11.6667 23.3333H19.8333C21.1221 23.3333 22.1667 22.2887 22.1667 21V12.8333C22.1667 11.5446 21.1221 10.5 19.8333 10.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.16667 17.5C6.88333 17.5 5.83333 16.45 5.83333 15.1667V7C5.83333 5.71667 6.88333 4.66667 8.16667 4.66667H16.3333C17.6167 4.66667 18.6667 5.71667 18.6667 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Share icon component
const ShareIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2.33333V17.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.33333 7L14 2.33333L18.6667 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.3333 14V22.1667C23.3333 22.7855 23.0875 23.379 22.6499 23.8166C22.2123 24.2542 21.6188 24.5 21 24.5H7C6.38116 24.5 5.78767 24.2542 5.35008 23.8166C4.9125 23.379 4.66667 22.7855 4.66667 22.1667V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export default function ReceiveSheet({
  trigger,
  open,
  onOpenChange,
  walletAddress: propAddress,
}: ReceiveSheetProps) {
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string | null>(propAddress || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_RESET_TIMEOUT);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  useEffect(() => {
    // If propAddress is provided, use it directly
    if (propAddress) {
      setAddress(propAddress);
      return;
    }

    let isMounted = true;

    const loadAddress = async () => {
      setIsLoading(true);

      try {
        const publicKey = await getWalletPublicKey();

        if (isMounted) {
          setAddress(publicKey.toBase58());
        }
      } catch (error) {
        console.error("Failed to fetch wallet address", error);

        if (isMounted) {
          setAddress(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAddress();

    return () => {
      isMounted = false;
    };
  }, [propAddress]);

  const copyAddress = useCallback(async () => {
    if (!address) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API is not available");
      }

      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }
    } catch (error) {
      console.error("Failed to copy wallet address", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }
    }
  }, [address]);

  const shareAddress = useCallback(() => {
    if (!address) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    // Use Telegram native share
    if (shareURL.isAvailable()) {
      const solscanUrl = `https://solscan.io/account/${address}`;
      shareURL(solscanUrl, `My Solana wallet address:\n${address}`);
    } else {
      // Fallback to copy if Telegram share is not available
      void copyAddress();
    }
  }, [address, copyAddress]);

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    [],
  );

  return (
    <Modal
      aria-label="Receive assets"
      trigger={trigger || <button style={{ display: 'none' }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={[1]}
    >
      <div
        style={{
          background: "rgba(38, 38, 38, 0.55)",
          backgroundBlendMode: "luminosity",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Receive assets</VisuallyHidden>
        </Drawer.Title>

        {/* Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          {/* Title */}
          <span className="text-base font-medium text-white tracking-[-0.176px]">
            Receive
          </span>

          {/* Close Button */}
          <Modal.Close>
            <div
              onClick={() => {
                if (hapticFeedback.impactOccurred.isAvailable()) {
                  hapticFeedback.impactOccurred("light");
                }
              }}
              className="absolute right-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150 cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <X size={24} strokeWidth={1.5} className="text-white/60" />
            </div>
          </Modal.Close>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center pt-8">
          {/* SOL Badge */}
          <div className="flex items-center gap-1 mb-3">
            {/* Solana Icon */}
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.06"/>
              <g transform="translate(12, 13.5)">
                <path d="M23.1924 16.44L19.3438 20.5664C19.2603 20.6558 19.1595 20.7272 19.0474 20.7761C18.9353 20.825 18.8144 20.8505 18.6921 20.8508H0.447039C0.36021 20.8503 0.275386 20.8247 0.202873 20.7769C0.13036 20.7291 0.0732815 20.6613 0.0385726 20.5817C0.00386358 20.5022 -0.00698128 20.4142 0.00735584 20.3286C0.021693 20.2429 0.0605948 20.1633 0.119334 20.0993L3.96328 15.9729C4.04669 15.8835 4.14755 15.8121 4.25963 15.7632C4.37171 15.7143 4.49263 15.6889 4.61492 15.6885H22.86C22.9478 15.6868 23.0341 15.711 23.1082 15.7582C23.1822 15.8053 23.2407 15.8733 23.2762 15.9536C23.3117 16.0339 23.3227 16.1229 23.3078 16.2095C23.2929 16.296 23.2528 16.3762 23.1924 16.44ZM19.3438 8.12774C19.26 8.03876 19.1591 7.96768 19.0471 7.9188C18.9351 7.86992 18.8143 7.84426 18.6921 7.84336H0.447039C0.360027 7.84341 0.274919 7.86884 0.20214 7.91653C0.129362 7.96422 0.0720726 8.0321 0.037291 8.11186C0.00250933 8.19161 -0.00825458 8.27978 0.00631777 8.36557C0.0208901 8.45135 0.060166 8.53102 0.119334 8.59482L3.96328 12.7241C4.04703 12.8131 4.14796 12.8842 4.25997 12.933C4.37197 12.9819 4.49272 13.0076 4.61492 13.0085H22.86C22.9467 13.0077 23.0312 12.9817 23.1035 12.9338C23.1757 12.8859 23.2325 12.8181 23.267 12.7386C23.3014 12.6591 23.3121 12.5712 23.2977 12.4858C23.2833 12.4003 23.2444 12.3208 23.1858 12.257L19.3438 8.12774ZM0.447039 5.16333H18.6921C18.8144 5.16299 18.9353 5.13757 19.0474 5.08866C19.1595 5.03974 19.2603 4.96837 19.3438 4.87895L23.1924 0.751556C23.2372 0.703688 23.2709 0.646566 23.2911 0.584231C23.3114 0.521896 23.3177 0.455872 23.3096 0.39083C23.3015 0.325788 23.2792 0.263317 23.2443 0.207838C23.2094 0.152359 23.1628 0.105228 23.1077 0.0697786C23.0338 0.0225391 22.9476 -0.00171392 22.86 9.42152e-05H4.61492C4.49263 0.000441112 4.37171 0.0258563 4.25963 0.07477C4.14755 0.123684 4.04669 0.195057 3.96328 0.284482L0.119334 4.41187C0.060166 4.47567 0.0208901 4.55534 0.00631777 4.64112C-0.00825458 4.72691 0.00250933 4.81508 0.037291 4.89483C0.0720726 4.97459 0.129362 5.04247 0.20214 5.09016C0.274919 5.13785 0.360027 5.16328 0.447039 5.16333Z" fill="white"/>
              </g>
            </svg>
            <span className="text-xl font-semibold text-white">SOL</span>
            <div
              className="px-1.5 py-0.5 rounded ml-1"
              style={{ background: "rgba(255, 255, 255, 0.06)" }}
            >
              <span className="text-sm text-white/60">Solana</span>
            </div>
          </div>

          {/* Warning Text */}
          <p className="text-center text-sm text-white/60 leading-5 mb-6 px-6">
            Only send Solana (SOL) assets to this address.{"\n"}Other assets will be lost forever.
          </p>

          {/* QR Code Card */}
          <div
            className="rounded-2xl p-6 mb-4 mx-6"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="relative">
              {/* QR Code with rounded corners and center logo */}
              {address ? (
                <StyledQRCode
                  value={address}
                  size={192}
                  logoSrc="/Mark.svg"
                  logoSize={48}
                />
              ) : (
                <div className="w-[192px] h-[192px] flex items-center justify-center">
                  <span className="text-white/40">{isLoading ? "Loading..." : "No address"}</span>
                </div>
              )}
            </div>

            {/* Address Display - Clickable to copy */}
            <button
              onClick={copyAddress}
              disabled={!address || isLoading}
              className="text-center text-sm text-white/80 leading-5 mt-4 font-mono break-all w-[192px] h-[60px] active:opacity-70 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? "Loading..." : address || "—"}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full px-6 pb-4 mt-auto">
            {/* Copy Button */}
            <button
              onClick={copyAddress}
              disabled={!address || isLoading}
              className="flex-1 flex flex-col gap-2 items-center justify-center active:opacity-70 transition-opacity disabled:opacity-50"
            >
              <div
                className="p-3 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <CopyIcon />
              </div>
              <span className="text-[13px] text-white/60 min-w-[52px] text-center">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={shareAddress}
              disabled={!address || isLoading}
              className="flex-1 flex flex-col gap-2 items-center justify-center active:opacity-70 transition-opacity disabled:opacity-50"
            >
              <div
                className="p-3 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <ShareIcon />
              </div>
              <span className="text-[13px] text-white/60">Share</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

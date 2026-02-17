"use client";

import { biometry } from "@telegram-apps/sdk";
import { hapticFeedback, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import Lottie from "lottie-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCodeLib from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { sileo } from "sileo";

import { useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import { buildBioMiniAppUrl } from "@/lib/telegram/mini-app/start-param";

import dogAnimation from "../../../../public/biometrics/dog.json";
import shieldAnimation from "../../../../public/biometrics/shield.json";

type VerifyStep =
  | "checking"
  | "desktop"
  | "no-biometrics"
  | "no-access"
  | "ready"
  | "verified";

// ---------------------------------------------------------------------------
// Styled QR Code (same rendering approach as ReceiveSheet)
// ---------------------------------------------------------------------------

function VerifyQRCode({ value, size }: { value: string; size: number }) {
  const [modules, setModules] = useState<boolean[][]>([]);
  const logoSize = 48;

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
  const finderSize = 7;
  const cornerRadius = cellSize * 1.5;

  const isFinderPattern = (row: number, col: number) => {
    if (row < finderSize && col < finderSize) return true;
    if (row < finderSize && col >= moduleCount - finderSize) return true;
    if (row >= moduleCount - finderSize && col < finderSize) return true;
    return false;
  };

  const centerStart = Math.floor((moduleCount - logoSize / cellSize) / 2);
  const centerEnd = Math.ceil((moduleCount + logoSize / cellSize) / 2);
  const isCenterArea = (row: number, col: number) =>
    row >= centerStart &&
    row < centerEnd &&
    col >= centerStart &&
    col < centerEnd;

  const renderFinderPattern = (
    startRow: number,
    startCol: number,
    id: string,
  ) => {
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
          fill="black"
          mask={`url(#finder-mask-${id})`}
        />
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
              fill="black"
            />
          );
        }),
      )}

      {renderFinderPattern(0, 0, "v-tl")}
      {renderFinderPattern(0, moduleCount - finderSize, "v-tr")}
      {renderFinderPattern(moduleCount - finderSize, 0, "v-bl")}

      {/* Center logo — Shield */}
      <image
        href="/Shield.svg"
        x={(size - logoSize) / 2}
        y={(size - logoSize) / 2}
        width={logoSize}
        height={logoSize}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Verify Page
// ---------------------------------------------------------------------------

export default function VerifyPage() {
  const [step, setStep] = useState<VerifyStep>("checking");
  const [copied, setCopied] = useState(false);
  const { bottom: safeBottom } = useTelegramSafeArea();
  const router = useRouter();

  // ---- Determine step on mount ----
  useEffect(() => {
    let platform: string | undefined;
    try {
      const launchParams = retrieveLaunchParams();
      platform = launchParams.tgWebAppPlatform;
    } catch {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        platform = params.get("tgWebAppPlatform") || undefined;
      }
    }

    const isMobile = platform === "ios" || platform === "android";
    if (!isMobile) {
      setStep("desktop");
      return;
    }

    // Mobile: check biometry
    async function checkBiometry() {
      if (!biometry.isSupported()) {
        setStep("no-biometrics");
        return;
      }

      try {
        if (biometry.mount.isAvailable()) {
          await biometry.mount(undefined);
        } else {
          setStep("no-biometrics");
          return;
        }
      } catch {
        setStep("no-biometrics");
        return;
      }

      const state = biometry.state();
      if (!state.available) {
        setStep("no-biometrics");
        return;
      }

      if (!state.accessGranted) {
        setStep("no-access");
        return;
      }

      setStep("ready");
    }

    void checkBiometry();

    return () => {
      try {
        if (biometry.isMounted?.()) {
          biometry.unmount();
        }
      } catch {
        /* noop */
      }
    };
  }, []);

  // ---- Actions ----

  const bioUrl = buildBioMiniAppUrl();

  const handleCopyLink = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    try {
      await navigator.clipboard.writeText(bioUrl);
      setCopied(true);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      sileo.error({ title: "Failed to copy link", description: "Please copy it manually." });
    }
  }, [bioUrl]);

  const handleRequestAccess = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    try {
      if (biometry.requestAccess.isAvailable()) {
        const granted = await biometry.requestAccess({
          reason: "Verify your identity with biometrics",
        });
        if (granted) {
          setStep("ready");
        } else {
          sileo.error({ title: "Access denied", description: "Biometric access was not granted." });
        }
      }
    } catch (err) {
      console.error("Failed to request biometry access", err);
      sileo.error({ title: "Something went wrong", description: "Could not request biometric access." });
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    if (biometry.openSettings.isAvailable()) {
      biometry.openSettings();
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    try {
      if (biometry.authenticate.isAvailable()) {
        const { status } = await biometry.authenticate({
          reason: "Confirm you're human",
        });
        if (status === "authorized") {
          if (hapticFeedback.notificationOccurred.isAvailable()) {
            hapticFeedback.notificationOccurred("success");
          }
          setStep("verified");
        } else {
          sileo.error({ title: "Verification failed", description: "Biometric check was not successful. Please try again." });
        }
      }
    } catch (err) {
      console.error("Biometry authentication failed", err);
      sileo.error({ title: "Something went wrong", description: "Biometric authentication failed unexpectedly." });
    }
  }, []);

  const handleDone = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    router.push("/telegram/wallet");
  }, [router]);

  const bottomPadding = Math.max(safeBottom, 16) + 16;


  // ---- Checking state ----

  if (step === "checking") {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        <div className="animate-pulse text-[17px] text-[rgba(60,60,67,0.6)]">
          Checking...
        </div>
      </main>
    );
  }

  // ---- Desktop — QR code ----

  if (step === "desktop") {
    return (
      <main className="flex flex-1 flex-col bg-white font-sans">
        <div
          className="flex flex-1 flex-col items-center justify-between px-8"
          style={{ paddingBottom: bottomPadding }}
        >
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8">
              <VerifyQRCode value={bioUrl} size={240} />
            </div>
            <h1 className="mb-3 text-center text-[22px] font-semibold leading-[28px] text-black">
              Verification Requires a Mobile Device
            </h1>
            <p className="max-w-[300px] text-center text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)]">
              Scan the QR code with Telegram on a mobile device that supports
              Face ID or Touch ID to continue
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="mt-8 h-[50px] w-full max-w-[358px] rounded-full bg-black text-[17px] font-normal leading-[22px] text-white active:opacity-80 transition-opacity"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </main>
    );
  }

  // ---- Biometrics not available ----

  if (step === "no-biometrics") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-white px-8 font-sans">
        <div className="relative mb-8 h-[200px] w-[200px]">
          <Image
            src="/biometrics/not-avail.png"
            alt="Biometrics not available"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="mb-3 text-center text-[22px] font-semibold leading-[28px] text-black">
          Biometrics not available on this device
        </h1>
        <p className="max-w-[300px] text-center text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)]">
          This device doesn&apos;t support Face ID or fingerprint, or it
          isn&apos;t set up. Use a device with biometric authentication enabled
          to continue.
        </p>
      </main>
    );
  }

  // ---- Access not granted ----

  if (step === "no-access") {
    return (
      <main className="flex flex-1 flex-col bg-white font-sans">
        <div
          className="flex flex-1 flex-col items-center justify-between px-8"
          style={{ paddingBottom: bottomPadding }}
        >
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8 h-[200px] w-[200px]">
              <Lottie animationData={shieldAnimation} loop />
            </div>
            <h1 className="mb-3 text-center text-[22px] font-semibold leading-[28px] text-black">
              Allow Telegram to Use Biometrics
            </h1>
            <p className="max-w-[300px] text-center text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)]">
              To continue, enable Face ID or fingerprint for Telegram in your
              phone settings.
            </p>
          </div>

          <div className="flex w-full max-w-[358px] flex-col gap-3">
            <button
              onClick={handleRequestAccess}
              className="h-[50px] w-full rounded-full bg-black text-[17px] font-normal leading-[22px] text-white active:opacity-80 transition-opacity"
            >
              Enable Biometrics
            </button>
            <button
              onClick={handleOpenSettings}
              className="h-[50px] w-full rounded-full text-[17px] font-normal leading-[22px] text-black active:opacity-80 transition-opacity"
              style={{ background: "rgba(0, 0, 0, 0.06)" }}
            >
              Open Settings
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---- Ready — Confirm You're Human ----

  if (step === "ready") {
    return (
      <main className="flex flex-1 flex-col bg-white font-sans">
        <div
          className="flex flex-1 flex-col items-center justify-between px-8"
          style={{ paddingBottom: bottomPadding }}
        >
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8 h-[200px] w-[200px]">
              <Lottie animationData={shieldAnimation} loop />
            </div>
            <h1 className="mb-3 text-center text-[22px] font-semibold leading-[28px] text-black">
              Confirm You&apos;re Human
            </h1>
            <p className="max-w-[300px] text-center text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)]">
              We detected unusual activity. Please complete a quick biometric
              check to continue. It only takes a moment.
            </p>
          </div>

          <button
            onClick={handleVerify}
            className="h-[50px] w-full max-w-[358px] rounded-full bg-black text-[17px] font-normal leading-[22px] text-white active:opacity-80 transition-opacity"
          >
            Verify
          </button>
        </div>
      </main>
    );
  }

  // ---- Verified ----

  return (
    <main className="flex flex-1 flex-col bg-white font-sans">
      <div
        className="flex flex-1 flex-col items-center justify-between px-8"
        style={{ paddingBottom: bottomPadding }}
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-8 h-[200px] w-[200px]">
            <Lottie animationData={dogAnimation} loop />
          </div>
          <h1 className="mb-3 text-center text-[22px] font-semibold leading-[28px] text-black">
            You&apos;re Verified
          </h1>
          <p className="max-w-[300px] text-center text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)]">
            Thanks for confirming. You can now continue using the app.
          </p>
        </div>

        <div className="flex w-full max-w-[358px] flex-col items-center gap-4">
          <button
            onClick={handleDone}
            className="h-[50px] w-full rounded-full bg-black text-[17px] font-normal leading-[22px] text-white active:opacity-80 transition-opacity"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => {
              sileo.error({
                title: "Something went wrong",
                description: "Please try again later.",
              });
            }}
            className="py-2 px-4 text-[13px] text-[rgba(60,60,67,0.4)] underline active:opacity-60"
          >
            Test error toast
          </button>
        </div>
      </div>
    </main>
  );
}

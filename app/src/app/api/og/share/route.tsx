import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

async function loadGoogleFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

const formatUsd = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `≈$${value}`;
  return `≈$${parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatSol = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${value} SOL`;
  return `+${parsed.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} SOL`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sender = searchParams.get("sender") || "@username";
    const receiver = searchParams.get("receiver") || "2fKB…Nhtj";
    const solAmount = searchParams.get("solAmount");
    const usdAmount = searchParams.get("usdAmount");

    const solText = formatSol(solAmount) || "+15.0988 SOL";
    const usdText = formatUsd(usdAmount) || "≈$2,869.77";

    const allText = `You received${solText}${usdText}FromTo${sender}${receiver}`;

    const [fontRegular, fontMedium, fontSemiBold, backgroundData, iconData, logoData] =
      await Promise.all([
        loadGoogleFont("Geist", 400, allText),
        loadGoogleFont("Geist", 500, allText),
        loadGoogleFont("Geist", 600, allText),
        readFile(join(process.cwd(), "public/share/Background-Filter.png")),
        readFile(join(process.cwd(), "public/share/Icon.svg")),
        readFile(join(process.cwd(), "public/share/Logo.svg")),
      ]);

    const backgroundBase64 = `data:image/png;base64,${backgroundData.toString("base64")}`;
    const iconBase64 = `data:image/svg+xml;base64,${iconData.toString("base64")}`;
    const logoBase64 = `data:image/svg+xml;base64,${logoData.toString("base64")}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
            fontFamily: "Geist",
          }}
        >
          {/* Background image */}
          <img
            src={backgroundBase64}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
            }}
          />

          {/* Background overlay filter */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              background: "rgba(22, 22, 26, 0.8)",
            }}
          />

          {/* Top section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <img
                src={iconBase64}
                alt=""
                style={{
                  width: "96px",
                  height: "96px",
                }}
              />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: "64px",
                  lineHeight: 1,
                  color: "white",
                  letterSpacing: "-0.64px",
                }}
              >
                You received
              </span>
            </div>
            <img
              src={logoBase64}
              alt="Loyal"
              style={{
                height: "96px",
              }}
            />
          </div>

          {/* Amount section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "96px",
                lineHeight: 1,
                color: "white",
                letterSpacing: "-0.96px",
              }}
            >
              {solText}
            </div>
            <div
              style={{
                fontSize: "48px",
                lineHeight: 1,
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {usdText}
            </div>
          </div>

          {/* From/To section */}
          <div
            style={{
              display: "flex",
              zIndex: 1,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "36px",
                  lineHeight: 1,
                  color: "rgba(255, 255, 255, 0.6)",
                  letterSpacing: "-0.36px",
                }}
              >
                From
              </div>
              <div
                style={{
                  fontSize: "56px",
                  lineHeight: 1,
                  color: "white",
                }}
              >
                {sender}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "36px",
                  lineHeight: 1,
                  color: "rgba(255, 255, 255, 0.6)",
                  letterSpacing: "-0.36px",
                }}
              >
                To
              </div>
              <div
                style={{
                  fontSize: "56px",
                  lineHeight: 1,
                  color: "white",
                }}
              >
                {receiver}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Geist",
            data: fontRegular,
            style: "normal",
            weight: 400,
          },
          {
            name: "Geist",
            data: fontMedium,
            style: "normal",
            weight: 500,
          },
          {
            name: "Geist",
            data: fontSemiBold,
            style: "normal",
            weight: 600,
          },
        ],
      }
    );
  } catch (e) {
    console.error("OG Image generation failed:", e);
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}

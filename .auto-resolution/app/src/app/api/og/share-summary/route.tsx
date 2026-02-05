import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

type ThemeVariant = "black" | "white" | "red";

const THEME_CONFIG: Record<
  ThemeVariant,
  {
    bg: string;
    dogPrefix: string;
    logo: string;
    textColor: string;
    dateOpacity: number;
  }
> = {
  black: {
    bg: "bg_black.png",
    dogPrefix: "Dark",
    logo: "Darklogo.png",
    textColor: "#FFFFFF",
    dateOpacity: 0.6,
  },
  white: {
    bg: "bg_white.png",
    dogPrefix: "Red",
    logo: "Lightlogo.png",
    textColor: "#000000",
    dateOpacity: 0.6,
  },
  red: {
    bg: "bg_red.png",
    dogPrefix: "Red",
    logo: "Redlogo.png",
    textColor: "#FFFFFF",
    dateOpacity: 0.8,
  },
};

const THEMES: ThemeVariant[] = ["black", "white", "red"];
const DOG_VARIANTS = Array.from({ length: 21 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + "...";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") || "";
    const date = searchParams.get("date") || "";

    const truncatedText = truncateText(text, 110);

    // Randomize theme and dog variant
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const dogVariant =
      DOG_VARIANTS[Math.floor(Math.random() * DOG_VARIANTS.length)];
    const config = THEME_CONFIG[theme];

    const allText = `Summary for ${date}${truncatedText}loyal`;

    const [fontMedium, backgroundData, dogData, logoData] = await Promise.all([
      loadGoogleFont("Geist", 500, allText),
      readFile(join(process.cwd(), `public/share_summary/bgs/${config.bg}`)),
      readFile(
        join(
          process.cwd(),
          `public/share_summary/dogs/${config.dogPrefix}${dogVariant}.png`
        )
      ),
      readFile(join(process.cwd(), `public/share_summary/logos/${config.logo}`)),
    ]);

    const backgroundBase64 = `data:image/png;base64,${backgroundData.toString("base64")}`;
    const dogBase64 = `data:image/png;base64,${dogData.toString("base64")}`;
    const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            position: "relative",
            display: "flex",
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

          {/* Date header */}
          <div
            style={{
              position: "absolute",
              top: 56,
              left: 56,
              display: "flex",
              color: config.textColor,
              opacity: config.dateOpacity,
              fontWeight: 500,
              fontSize: 48,
              lineHeight: 1,
              letterSpacing: "-0.96px",
            }}
          >
            Summary for {date}
          </div>

          {/* Main text */}
          <div
            style={{
              position: "absolute",
              top: 128,
              left: 56,
              display: "flex",
              width: 600,
              color: config.textColor,
              fontWeight: 500,
              fontSize: 48,
              lineHeight: 1.1,
              letterSpacing: "-0.96px",
              wordBreak: "break-word",
            }}
          >
            {truncatedText}
          </div>

          {/* Dog mascot */}
          <img
            src={dogBase64}
            alt=""
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 500,
              height: 500,
              objectFit: "contain",
              objectPosition: "bottom right",
            }}
          />

          {/* Logo */}
          <img
            src={logoBase64}
            alt=""
            style={{
              position: "absolute",
              bottom: 47,
              left: 56,
              height: 56,
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Geist",
            data: fontMedium,
            style: "normal",
            weight: 500,
          },
        ],
      }
    );
  } catch (e) {
    console.error("OG Summary Image generation failed:", e);
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}

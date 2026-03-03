import { NextResponse } from "next/server";

interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  image: string | null;
}

const IMG_SRC_REGEX = /<img[^>]+src="([^"]+)"/;
const IMG_SRC_REGEX_GLOBAL = /<img[^>]+src="([^"]+)"/g;
const CDATA_START = /^\s*<!\[CDATA\[\s*/;
const CDATA_END = /\s*\]\]>\s*$/;
const ITEM_REGEX = /<item>([\s\S]*?)<\/item>/g;
const TITLE_REGEX = /<title>([\s\S]*?)<\/title>/;
const LINK_REGEX = /<link>([\s\S]*?)<\/link>/;
const PUB_DATE_REGEX = /<pubDate>([\s\S]*?)<\/pubDate>/;
const CONTENT_REGEX = /<content:encoded>([\s\S]*?)<\/content:encoded>/;

function extractFirstImage(html: string): string | null {
  const match = html.match(IMG_SRC_REGEX);
  if (match?.[1]) {
    const src = match[1];
    if (src.includes("stat?event=")) {
      return null;
    }
    return src;
  }
  return null;
}

function extractCDATA(text: string): string {
  return text.replace(CDATA_START, "").replace(CDATA_END, "").trim();
}

function parseItem(itemXml: string): BlogPost {
  const titleMatch = itemXml.match(TITLE_REGEX);
  const linkMatch = itemXml.match(LINK_REGEX);
  const pubDateMatch = itemXml.match(PUB_DATE_REGEX);
  const contentMatch = itemXml.match(CONTENT_REGEX);

  const title = titleMatch ? extractCDATA(titleMatch[1]) : "";
  const link = linkMatch ? linkMatch[1].trim() : "";
  const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
  const content = contentMatch ? extractCDATA(contentMatch[1]) : "";

  let image = extractFirstImage(content);

  if (!image) {
    const allImages = content.matchAll(IMG_SRC_REGEX_GLOBAL);
    for (const img of allImages) {
      if (!img[1].includes("stat?event=")) {
        image = img[1];
        break;
      }
    }
  }

  return { title, link, pubDate, image };
}

export async function GET() {
  try {
    const res = await fetch("https://blog.askloyal.com/feed", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch feed" },
        { status: 502 }
      );
    }

    const xml = await res.text();
    const items: BlogPost[] = [];

    for (const itemMatch of xml.matchAll(ITEM_REGEX)) {
      if (items.length >= 3) {
        break;
      }
      items.push(parseItem(itemMatch[1]));
    }

    return NextResponse.json({ posts: items });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse feed" },
      { status: 500 }
    );
  }
}

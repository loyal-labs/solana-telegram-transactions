"use client";

import { IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import { memo, useEffect, useState } from "react";

const instrumentSerif = localFont({
  src: [
    {
      path: "../../public/fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  image: string | null;
}

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogSectionComponent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts ?? []);
      })
      .catch(() => {
        // Silently fail - section just won't show
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section
      id="blog-section"
      style={{
        padding: "4rem 1rem",
        background: "#000",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          className={instrumentSerif.className}
          style={{
            fontSize: "3.5rem",
            fontWeight: 400,
            color: "#fff",
            textAlign: "center",
            marginBottom: "1rem",
          }}
        >
          Blog
        </h2>
        <p
          className={instrumentSerif.className}
          style={{
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            marginBottom: "3rem",
            maxWidth: "800px",
            margin: "0 auto 4rem",
            lineHeight: 1.45,
          }}
        >
          Latest from our team
        </p>

        <div
          className="blog-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
          }}
        >
          {isLoading
            ? SKELETON_KEYS.map((key) => (
                <div
                  className={ibmPlexSans.className}
                  key={key}
                  style={{
                    background: "rgba(38, 38, 38, 0.5)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "24px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      background: "rgba(255, 255, 255, 0.04)",
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  <div style={{ padding: "1.25rem" }}>
                    <div
                      style={{
                        height: "1rem",
                        width: "60%",
                        background: "rgba(255, 255, 255, 0.06)",
                        borderRadius: "8px",
                        marginBottom: "0.75rem",
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        height: "0.75rem",
                        width: "35%",
                        background: "rgba(255, 255, 255, 0.04)",
                        borderRadius: "6px",
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
              ))
            : posts.map((post) => (
                <a
                  className="blog-card"
                  href={post.link}
                  key={post.link}
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    background: "rgba(38, 38, 38, 0.5)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "24px",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  target="_blank"
                >
                  {post.image && (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Image
                        alt={post.title}
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        src={post.image}
                        style={{
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                        unoptimized
                      />
                    </div>
                  )}
                  <div
                    className={ibmPlexSans.className}
                    style={{ padding: "1.25rem" }}
                  >
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.95)",
                        lineHeight: 1.4,
                        marginBottom: "0.625rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 400,
                        color: "rgba(255, 255, 255, 0.45)",
                      }}
                    >
                      {formatDate(post.pubDate)}
                    </span>
                  </div>
                </a>
              ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .blog-card:hover {
          border-color: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-4px);
        }
        .blog-card:hover img {
          transform: scale(1.05);
        }
        @media (max-width: 767px) {
          .blog-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .blog-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

export const BlogSection = memo(BlogSectionComponent);

"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import { memo, useState } from "react";
import { roadmapEvents } from "@/data/roadmap";

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

function RoadmapSectionComponent() {
  const q1_2026Index = roadmapEvents.findIndex(
    (item) =>
      item.year === 2026 &&
      item.periodType === "Q" &&
      item.periodNumber === 1
  );
  const initialRoadmapIndex = q1_2026Index >= 0 ? q1_2026Index : 0;
  const [currentIndex, setCurrentIndex] = useState(initialRoadmapIndex);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const formatPeriod = (item: (typeof roadmapEvents)[0]) => {
    if (item.periodType === "Q") {
      return `Q${item.periodNumber} ${item.year}`;
    }
    if (item.periodType === "H") {
      return `H${item.periodNumber} ${item.year}`;
    }
    return `${item.year}`;
  };

  const getStatus = (item: (typeof roadmapEvents)[0]) => {
    if (item.isChecked) {
      return {
        label: "Completed",
        color: "rgba(34, 197, 94, 0.8)",
      };
    }

    if (item.isActive) {
      return {
        label: "In progress",
        color: "rgba(249, 115, 22, 0.8)",
      };
    }

    const hasCompletedEvents = item.events.some((event) => event.isChecked);

    if (hasCompletedEvents) {
      return {
        label: "In progress",
        color: "rgba(249, 115, 22, 0.8)",
      };
    }

    return {
      label: "Planned",
      color: "rgba(156, 163, 175, 0.5)",
    };
  };

  const toggleExpand = (index: number) => {
    if (index === currentIndex) {
      setIsDetailsExpanded((prev) => !prev);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === roadmapEvents.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? roadmapEvents.length - 1 : prev - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    index: number
  ) => {
    const SWIPE_THRESHOLD = 50;
    if (info.offset.x > SWIPE_THRESHOLD && index === currentIndex) {
      prevSlide();
    } else if (info.offset.x < -SWIPE_THRESHOLD && index === currentIndex) {
      nextSlide();
    }
  };

  const cardVariants = {
    active: {
      x: 0,
      scale: 1,
      opacity: 1,
      zIndex: 10,
    },
    inactive: {
      scale: 0.9,
      opacity: 0.5,
      zIndex: 2,
    },
  };

  const cardTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

  return (
    <section
      id="roadmap-section"
      style={{
        padding: "4rem 1rem",
        background: "#000",
        position: "relative",
        overflowX: "hidden",
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
          Roadmap
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
          Our journey to building the most private AI assistant
        </p>

        <div style={{ position: "relative" }}>
          {/* Navigation buttons - inside relative container for proper positioning */}
          <button
            className="desktop-nav-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            style={{
              position: "absolute",
              left: "-4rem",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "3rem",
              height: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              pointerEvents: "auto",
            }}
            type="button"
          >
            <svg
              fill="none"
              height="24"
              style={{
                transform: "rotate(180deg)",
                color: "rgba(255, 255, 255, 0.7)",
              }}
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.75 8.75L14.25 12L10.75 15.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <button
            className="desktop-nav-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            style={{
              position: "absolute",
              right: "-4rem",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "3rem",
              height: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              pointerEvents: "auto",
            }}
            type="button"
          >
            <svg
              fill="none"
              height="24"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.75 8.75L14.25 12L10.75 15.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>

          {/* Carousel container */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: "30rem",
              touchAction: "pan-y",
            }}
          >
            {/* Fade overlays with mobile navigation */}
            <div
              onClick={prevSlide}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "8rem",
                background:
                  "linear-gradient(to right, #000 0%, transparent 100%)",
                zIndex: 5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingLeft: "0.75rem",
              }}
            >
              {/* Mobile chevron - hidden on desktop via media query */}
              <svg
                className="mobile-nav-chevron"
                fill="none"
                height="32"
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  transform: "rotate(180deg)",
                }}
                viewBox="0 0 24 24"
                width="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.75 8.75L14.25 12L10.75 15.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div
              onClick={nextSlide}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "8rem",
                background:
                  "linear-gradient(to left, #000 0%, transparent 100%)",
                zIndex: 5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "0.75rem",
              }}
            >
              {/* Mobile chevron - hidden on desktop via media query */}
              <svg
                className="mobile-nav-chevron"
                fill="none"
                height="32"
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                }}
                viewBox="0 0 24 24"
                width="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.75 8.75L14.25 12L10.75 15.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            {/* CSS for responsive navigation */}
            <style jsx>{`
              @media (max-width: 767px) {
                .desktop-nav-btn {
                  display: none !important;
                }
              }
              @media (min-width: 768px) {
                .mobile-nav-chevron {
                  display: none;
                }
              }
            `}</style>

            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {roadmapEvents.map((item, index) => {
                const status = getStatus(item);

                return (
                  <motion.div
                    animate={index === currentIndex ? "active" : "inactive"}
                    drag="x"
                    dragConstraints={{ left: -50, right: 50 }}
                    dragElastic={0.1}
                    initial="inactive"
                    key={index}
                    onClick={() => {
                      if (index !== currentIndex) {
                        goToSlide(index);
                      }
                    }}
                    onDragEnd={(e, info) => handleDragEnd(e, info, index)}
                    style={{
                      position: "absolute",
                      width: "18rem",
                      x: `${Math.round((index - currentIndex) * 300)}px`,
                      willChange: "transform",
                      transform: "translateZ(0)",
                      cursor: index !== currentIndex ? "pointer" : "default",
                    }}
                    variants={cardVariants}
                  >
                    {/* Card */}
                    <motion.div
                      layout
                      style={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div
                        className={ibmPlexSans.className}
                        style={{
                          position: "relative",
                          background: "rgba(38, 38, 38, 0.5)",
                          backdropFilter: "blur(24px) saturate(180%)",
                          WebkitBackdropFilter: "blur(24px) saturate(180%)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "24px",
                          overflow: "visible",
                          boxShadow:
                            "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                        }}
                      >
                        {/* Red dot indicator on active card */}
                        <motion.div
                          animate={{
                            scale: index === currentIndex ? [0, 1.4, 1] : 0,
                            opacity: index === currentIndex ? 1 : 0,
                          }}
                          initial={false}
                          style={{
                            position: "absolute",
                            top: "-8px",
                            left: "calc(50% - 8px)",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "#ef4444",
                            zIndex: 10,
                          }}
                          transition={{
                            scale: {
                              duration: 0.4,
                              ease: [0.34, 1.56, 0.64, 1],
                              delay: index === currentIndex ? 0.2 : 0,
                            },
                            opacity: {
                              duration: 0.15,
                              delay: index === currentIndex ? 0.2 : 0,
                            },
                          }}
                        />
                        {/* Red glow clipped to card surface */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            borderRadius: "24px",
                            pointerEvents: "none",
                          }}
                        >
                          <motion.div
                            animate={{
                              opacity: index === currentIndex ? 1 : 0,
                              scale: index === currentIndex ? 1 : 0.5,
                            }}
                            initial={false}
                            style={{
                              position: "absolute",
                              top: "-50px",
                              left: "calc(50% - 80px)",
                              width: "160px",
                              height: "100px",
                              background:
                                "radial-gradient(ellipse at center top, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.15) 40%, transparent 70%)",
                              pointerEvents: "none",
                            }}
                            transition={{
                              opacity: {
                                duration: 0.4,
                                delay: index === currentIndex ? 0.2 : 0,
                              },
                              scale: {
                                duration: 0.4,
                                ease: [0.34, 1.56, 0.64, 1],
                                delay: index === currentIndex ? 0.2 : 0,
                              },
                            }}
                          />
                        </div>
                        {/* Card header */}
                        <div
                          onClick={() => toggleExpand(index)}
                          style={{
                            padding: "1.5rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            cursor:
                              index === currentIndex ? "pointer" : "default",
                          }}
                        >
                          {/* Period badge */}
                          <div
                            style={{
                              padding: "0.375rem 0.875rem",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "rgba(255, 255, 255, 0.7)",
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "999px",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {item.year}
                          </div>

                          <h3
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: 600,
                              color: "rgba(255, 255, 255, 0.95)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {`${formatPeriod(item)} Goals`}
                          </h3>

                          {/* Status */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              fontSize: "0.875rem",
                              color: "rgba(255, 255, 255, 0.6)",
                              marginTop: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                width: "0.5rem",
                                height: "0.5rem",
                                marginRight: "0.5rem",
                                borderRadius: "50%",
                                background: status.color,
                              }}
                            />
                            {status.label}
                          </div>

                          {/* Expand indicator */}
                          {index === currentIndex && (
                            <motion.div
                              animate={{
                                rotate: isDetailsExpanded ? 180 : 0,
                              }}
                              style={{ marginTop: "0.75rem" }}
                              transition={{ duration: 0.3 }}
                            >
                              <svg
                                fill="none"
                                height="20"
                                style={{ color: "rgba(255, 255, 255, 0.4)" }}
                                viewBox="0 0 24 24"
                                width="20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 9L12 15L18 9"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isDetailsExpanded && index === currentIndex && (
                            <motion.div
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              initial={{ height: 0, opacity: 0 }}
                              style={{ overflow: "hidden" }}
                              transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                              }}
                            >
                              <div
                                style={{
                                  padding: "0 1.5rem 1.5rem",
                                  borderTop:
                                    "1px solid rgba(255, 255, 255, 0.06)",
                                  paddingTop: "1rem",
                                }}
                              >
                                <h4
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "rgba(255, 255, 255, 0.8)",
                                    textAlign: "center",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  Events
                                </h4>
                                <ul
                                  style={{
                                    display: "grid",
                                    gap: "0.75rem",
                                  }}
                                >
                                  {item.events.map((event, i) => (
                                    <motion.li
                                      animate={{ opacity: 1, x: 0 }}
                                      initial={{ opacity: 0, x: -20 }}
                                      key={i}
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                      }}
                                      transition={{
                                        duration: 0.3,
                                        delay: i * 0.1,
                                        ease: "easeOut",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: "0.5rem",
                                          height: "0.5rem",
                                          marginRight: "0.75rem",
                                          marginTop: "0.35rem",
                                          flexShrink: 0,
                                          borderRadius: "50%",
                                          background: event.isChecked
                                            ? "rgba(34, 197, 94, 0.8)"
                                            : "rgba(156, 163, 175, 0.5)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          fontSize: "0.875rem",
                                          color: "rgba(255, 255, 255, 0.7)",
                                          lineHeight: 1.5,
                                        }}
                                      >
                                        {event.title}
                                      </span>
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pagination dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
              gap: "0.5rem",
            }}
          >
            {roadmapEvents.map((_, index) => (
              <button
                aria-label={`Go to slide ${index + 1}`}
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  width: index === currentIndex ? "1.5rem" : "0.375rem",
                  height: "0.375rem",
                  borderRadius: "999px",
                  background:
                    index === currentIndex
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const RoadmapSection = memo(RoadmapSectionComponent);

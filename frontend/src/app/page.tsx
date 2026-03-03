"use client";

import { useChat } from "@ai-sdk/react";
import { useAccounts, useModal, usePhantom } from "@phantom/react-sdk";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowDownIcon,
  ArrowUpToLine,
  MoreHorizontal,
  RefreshCw,
  ShieldQuestionMark,
  X,
} from "lucide-react";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BentoGridSection } from "@/components/bento-grid-section";
import { BlogSection } from "@/components/blog-section";
import { Footer } from "@/components/footer";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { RoadmapSection } from "@/components/roadmap-section";
import { TransactionWidget } from "@/components/transaction-widget";
import { CopyIcon, type CopyIconHandle } from "@/components/ui/copy";
import { MenuIcon, type MenuIconHandle } from "@/components/ui/menu";
import { PlusIcon, type PlusIconHandle } from "@/components/ui/plus";
import { useChatMode } from "@/contexts/chat-mode-context";
import { isSkillsEnabled } from "@/flags";

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

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const dirtyline = localFont({
  src: "../../public/fonts/Dirtyline 36daysoftype 2022.woff2",
  display: "swap",
});

type TimestampedMessage = UIMessage & { createdAt?: number };

export default function LandingPage() {
  const { messages, sendMessage, status, setMessages } =
    useChat<TimestampedMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
    });
  const [messageTimestamps, setMessageTimestamps] = useState<
    Record<string, number>
  >({});
  const [pendingText, setPendingText] = useState("");
  const [isChatModeLocal, setIsChatModeLocal] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isInputStuckToBottom, setIsInputStuckToBottom] = useState(false);
  const [stickyInputBottomOffset, setStickyInputBottomOffset] = useState(24);
  const { setIsChatMode } = useChatMode();

  // Check Skills feature flag
  const skillsEnabled = isSkillsEnabled();

  // Sync local state with context
  useEffect(() => {
    setIsChatMode(isChatModeLocal);
  }, [isChatModeLocal, setIsChatMode]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [pendingText]);

  // Use local state for component logic
  const isChatMode = isChatModeLocal;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const menuIconRef = useRef<MenuIconHandle>(null);
  const plusIconRef = useRef<PlusIconHandle>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyIconRefs = useRef<Map<string, CopyIconHandle>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Wallet hooks
  const { isConnected, isLoading: isWalletLoading } = usePhantom();
  const { open } = useModal();
  const accounts = useAccounts();
  const solanaAddress = accounts?.find(
    (acc) => acc.addressType === "Solana"
  )?.address;

  // Truncate wallet address for display (e.g., "233Q..7ABE")
  const truncatedAddress = solanaAddress
    ? `${solanaAddress.slice(0, 4)}..${solanaAddress.slice(-4)}`
    : "";
  // Track if we've already prompted auth on first input
  const [hasPromptedAuth, setHasPromptedAuth] = useState(false);

  // Prompt auth on first character typed
  // Wait until wallet loading is complete to avoid false triggers during initialization
  useEffect(() => {
    if (
      !(isWalletLoading || hasPromptedAuth || isConnected) &&
      pendingText.length > 0
    ) {
      setHasPromptedAuth(true);
      open();
    }
  }, [hasPromptedAuth, isConnected, isWalletLoading, pendingText, open]);

  // Toggle body class when sidebar opens (for header visibility on mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [isSidebarOpen]);

  const [isOnline, setIsOnline] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isScrolledToAbout, setIsScrolledToAbout] = useState(false);
  const [isScrolledToRoadmap, setIsScrolledToRoadmap] = useState(false);
  const [isScrolledToBlog, setIsScrolledToBlog] = useState(false);
  const [isScrolledToLinks, setIsScrolledToLinks] = useState(false);
  const prevScrolledToAbout = useRef(false);
  const prevScrolledToRoadmap = useRef(false);
  const prevScrolledToBlog = useRef(false);
  const prevScrolledToLinks = useRef(false);

  // Enable send when there's text input
  const hasUsableInput = pendingText.trim().length > 0;

  // Track timestamps for messages that arrive without metadata
  useEffect(() => {
    setMessageTimestamps((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const message of messages) {
        if (message.createdAt && next[message.id] !== message.createdAt) {
          next[message.id] = message.createdAt;
          changed = true;
          continue;
        }
        if (!message.createdAt && next[message.id] === undefined) {
          next[message.id] = Date.now();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [messages]);

  // Check if a chat operation is in progress
  const isLoading = status === "streaming" || status === "submitted";

  // Network status monitoring and recovery
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      setIsOnline(true);

      // Re-enable and refocus the input after network recovery
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.disabled = false;
          inputRef.current.focus();
          console.log("Input re-enabled after network recovery");
        }
      }, 100);
    };

    const handleOffline = () => {
      console.log("Network connection lost");
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Control menu icon animation based on sidebar state
  useEffect(() => {
    if (isSidebarOpen) {
      menuIconRef.current?.startAnimation();
    } else {
      menuIconRef.current?.stopAnimation();
    }
  }, [isSidebarOpen]);

  // Open Phantom modal when wallet disconnects in chat mode
  // Wait until wallet loading is complete to avoid false triggers during initialization
  useEffect(() => {
    if (!isWalletLoading && isChatMode && !isConnected) {
      open();
    }
  }, [isChatMode, isConnected, isWalletLoading, open]);

  // Pre-fill input from URL query parameter (e.g., ?req=hello)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reqParam = params.get("req");
    if (reqParam) {
      setPendingText(reqParam);
    }
  }, []);

  // Auto-focus on initial load (but not if there's a hash in URL or req param)
  useEffect(() => {
    // Don't auto-focus if there's a hash - let the hash scroll complete first
    const hasHash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasReqParam = params.get("req");
    // Skip if req param exists - the effect above handles focus
    if (!(hasHash || hasReqParam)) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // Run once on mount

  // Handle initial page load with hash in URL
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Wait for DOM to be ready
      const timer = setTimeout(() => {
        const navHeight = 80;
        let sectionId = "";

        switch (hash) {
          case "about":
            sectionId = "about-section";
            break;
          case "roadmap":
            sectionId = "roadmap-section";
            break;
          case "links":
            sectionId = "footer-section";
            break;
        }

        if (sectionId) {
          const section = document.getElementById(sectionId);
          if (section) {
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - navHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-focus input when entering chat mode with multiple fallback strategies
  useEffect(() => {
    if (isChatMode && inputRef.current) {
      const focusInput = () => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Also select any existing text
        }
      };

      // Strategy 1: Immediate focus attempt
      focusInput();

      // Strategy 2: After micro-task
      Promise.resolve().then(focusInput);

      // Strategy 3: After animation frame (for layout)
      requestAnimationFrame(() => {
        focusInput();

        // Strategy 4: After second animation frame (for paint)
        requestAnimationFrame(focusInput);
      });

      // Strategy 5: After transition completes (800ms based on CSS)
      const timeout1 = setTimeout(focusInput, 850);

      // Strategy 6: Multiple attempts with increasing delays
      const timeout2 = setTimeout(focusInput, 100);
      const timeout3 = setTimeout(focusInput, 300);
      const timeout4 = setTimeout(focusInput, 500);
      const timeout5 = setTimeout(focusInput, 1000);

      // Cleanup
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        clearTimeout(timeout5);
      };
    }
  }, [isChatMode]);

  // Keep focus on textarea when messages change (e.g., after receiving response)
  useEffect(() => {
    if (isChatMode && messages.length > 0 && inputRef.current) {
      // Small delay to ensure UI has updated
      const timeout = setTimeout(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [messages, isChatMode]);

  // Auto-resize textarea when input changes
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use a longer delay to ensure markdown rendering is complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
        setShowScrollButton(false);
      }, 100);
    }
  }, [messages, status]);

  // Scroll detection for showing/hiding scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Add a small delay to debounce scroll events for smoother animation
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 0);
      }, 50);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [messages.length]);

  // Detect when user scrolls to About section
  useEffect(() => {
    if (isChatMode) return; // Don't track scroll in chat mode

    const handlePageScroll = () => {
      const aboutSection = document.getElementById("about-section");
      const roadmapSection = document.getElementById("roadmap-section");
      const blogSection = document.getElementById("blog-section");
      const footerSection = document.getElementById("footer-section");

      // Check if we're at the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10;

      // If at bottom, activate links section
      if (isAtBottom && footerSection) {
        setIsScrolledToAbout(false);
        setIsScrolledToRoadmap(false);
        setIsScrolledToBlog(false);
        setIsScrolledToLinks(true);
        return;
      }

      // Calculate which section is closest to the top threshold
      const sections = [
        { id: "about", element: aboutSection, setter: setIsScrolledToAbout },
        {
          id: "roadmap",
          element: roadmapSection,
          setter: setIsScrolledToRoadmap,
        },
        { id: "blog", element: blogSection, setter: setIsScrolledToBlog },
        { id: "links", element: footerSection, setter: setIsScrolledToLinks },
      ];

      let closestSection = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const isInView = rect.top <= 100 && rect.bottom >= 100;

          if (isInView) {
            // Calculate distance from top of section to threshold
            const distance = Math.abs(rect.top - 100);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSection = section;
            }
          }
        }
      }

      // Set only the closest section as active
      for (const section of sections) {
        section.setter(section === closestSection);
      }
    };

    window.addEventListener("scroll", handlePageScroll, { passive: true });
    handlePageScroll(); // Check initial state

    return () => {
      window.removeEventListener("scroll", handlePageScroll);
    };
  }, [isChatMode]);

  // Parallax effect for landing page input + sticky behavior
  useEffect(() => {
    if (isChatMode) {
      setParallaxOffset(0);
      setIsInputStuckToBottom(false);
      setStickyInputBottomOffset(24);
      return;
    }

    const handleParallaxScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Move the input at 0.15 of the scroll speed (subtle parallax)
      const offset = scrollY * 0.15;
      setParallaxOffset(offset);

      // Calculate when the input's natural position goes above viewport
      // Input is centered at viewportHeight/2, moves up at 0.85x scroll speed
      // Stick when the input center would be above ~120px from top
      const inputNaturalCenterFromTop = viewportHeight / 2 - scrollY * 0.85;
      const stickThreshold = 120; // When input center reaches this point from top

      if (inputNaturalCenterFromTop < stickThreshold) {
        setIsInputStuckToBottom(true);
        setStickyInputBottomOffset(24);
      } else {
        setIsInputStuckToBottom(false);
        setStickyInputBottomOffset(24);
      }
    };

    window.addEventListener("scroll", handleParallaxScroll, { passive: true });
    handleParallaxScroll();

    return () => {
      window.removeEventListener("scroll", handleParallaxScroll);
    };
  }, [isChatMode]);

  // Reset hover state when About or Roadmap button changes to/from icon mode
  // This forces the hover indicator to recalculate its position after DOM updates
  useEffect(() => {
    // Only recalculate if the state actually changed (not just on every render)
    const aboutChanged = prevScrolledToAbout.current !== isScrolledToAbout;
    const roadmapChanged =
      prevScrolledToRoadmap.current !== isScrolledToRoadmap;
    const blogChanged = prevScrolledToBlog.current !== isScrolledToBlog;
    const linksChanged = prevScrolledToLinks.current !== isScrolledToLinks;

    if (
      (aboutChanged || roadmapChanged || blogChanged || linksChanged) &&
      (hoveredNavIndex === 0 || hoveredNavIndex === 1 || hoveredNavIndex === 2 || hoveredNavIndex === 3)
    ) {
      // Index 0 is About, Index 1 is Roadmap, Index 2 is Blog, Index 3 is Links
      const currentIndex = hoveredNavIndex;
      setHoveredNavIndex(null);
      // Use double requestAnimationFrame to ensure layout has been recalculated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHoveredNavIndex(currentIndex);
        });
      });
    }

    prevScrolledToAbout.current = isScrolledToAbout;
    prevScrolledToRoadmap.current = isScrolledToRoadmap;
    prevScrolledToBlog.current = isScrolledToBlog;
    prevScrolledToLinks.current = isScrolledToLinks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrolledToAbout, isScrolledToRoadmap, isScrolledToBlog, isScrolledToLinks]);

  // Handler for new TransactionWidget completions
  // Success/error states are now shown within the widget itself
  const handleTransactionWidgetComplete = (
    _type: "send" | "swap",
    _result: { signature?: string }
  ) => {
    // No-op: success is displayed within the TransactionWidget
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if a chat operation is in progress
    if (isLoading) {
      return;
    }

    // Check if wallet is connected before sending
    if (!isConnected) {
      open();
      return;
    }

    if (!hasUsableInput) {
      return;
    }

    setIsChatModeLocal(true);

    // Send message to LLM
    const messageText = pendingText.trim();
    if (messageText) {
      sendMessage({ text: messageText });
      setPendingText("");
    }

    // Ensure focus
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);

      // Trigger animation on the specific copy icon
      const iconHandle = copyIconRefs.current.get(messageId);
      iconHandle?.startAnimation();

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
        iconHandle?.stopAnimation();
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
    setShowScrollButton(false);
  };

  const handleScrollToAbout = () => {
    const aboutSection = document.getElementById("about-section");
    if (aboutSection) {
      const navHeight = 80; // Height of nav + extra spacing
      const elementPosition = aboutSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash
      window.history.pushState(null, "", "#about");
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Remove hash from URL
    window.history.pushState(null, "", window.location.pathname);
  };

  const handleScrollToRoadmap = () => {
    const roadmapSection = document.getElementById("roadmap-section");
    if (roadmapSection) {
      const navHeight = 80;
      const elementPosition = roadmapSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash
      window.history.pushState(null, "", "#roadmap");
    }
  };

  const handleScrollToBlog = () => {
    const blogSection = document.getElementById("blog-section");
    if (blogSection) {
      const navHeight = 80;
      const elementPosition = blogSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash
      window.history.pushState(null, "", "#blog");
    }
  };

  const handleScrollToLinks = () => {
    const footerSection = document.getElementById("footer-section");
    if (footerSection) {
      const navHeight = 80;
      const elementPosition = footerSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash
      window.history.pushState(null, "", "#links");
    }
  };

  // Mock data for previous chats - replace with real data later
  const previousChats = [
    { id: "1", title: "What is quantum computing?", timestamp: "2 hours ago" },
    { id: "2", title: "Explain blockchain technology", timestamp: "Yesterday" },
    { id: "3", title: "How does AI work?", timestamp: "2 days ago" },
  ];

  return (
    <main
      className={ibmPlexSans.className}
      style={{
        margin: 0,
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#000",
        overflow: isChatMode ? "hidden" : "auto",
      }}
    >
      {/* Main content wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          display: isChatMode ? "flex" : "block",
          flexDirection: "column",
        }}
      >
        {/* First section */}
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
          {/* Dark overlay for chat mode */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(22, 22, 26, 0.95)",
              backdropFilter: isChatMode ? "blur(40px)" : "blur(10px)",
              opacity: isChatMode ? 1 : 0,
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: isChatMode ? "auto" : "none",
            }}
          />

          {/* Navigation Bar - Desktop only - Fixed to viewport */}
          {!isChatMode && (
            <nav
              className="hidden md:flex"
              onMouseLeave={() => setHoveredNavIndex(null)}
              style={{
                position: "fixed",
                top: "1.4375rem",
                left: "50%",
                transform: "translateX(-50%)",
                alignItems: "center",
                gap: "1.5rem",
                background: "rgba(38, 38, 38, 0.7)",
                backdropFilter: "blur(48px)",
                borderRadius: "60px",
                padding: "4px",
                boxShadow:
                  "0px 0px 8px 0px rgba(0, 0, 0, 0.1), 0px 16px 16px 0px rgba(0, 0, 0, 0.2)",
                mixBlendMode: "luminosity",
                zIndex: 60,
              }}
            >
              {/* Nav items group */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Sliding hover indicator */}
                {hoveredNavIndex !== null &&
                  navItemRefs.current[hoveredNavIndex] && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left:
                          navItemRefs.current[hoveredNavIndex]?.offsetLeft || 0,
                        width:
                          navItemRefs.current[hoveredNavIndex]?.offsetWidth ||
                          0,
                        height:
                          navItemRefs.current[hoveredNavIndex]?.offsetHeight ||
                          0,
                        transform: "translateY(-50%)",
                        background: "rgba(255, 255, 255, 0.1)",
                        mixBlendMode: "lighten",
                        backdropFilter: "blur(48px)",
                        borderRadius: "9999px",
                        boxShadow:
                          "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        pointerEvents: "none",
                        zIndex: 0,
                      }}
                    />
                  )}
                {[
                  {
                    label: "About",
                    onClick: isScrolledToAbout
                      ? handleBackToTop
                      : handleScrollToAbout,
                    isAbout: true,
                  },
                  {
                    label: "Roadmap",
                    onClick: isScrolledToRoadmap
                      ? handleBackToTop
                      : handleScrollToRoadmap,
                    isRoadmap: true,
                  },
                  {
                    label: "Blog",
                    onClick: isScrolledToBlog
                      ? handleBackToTop
                      : handleScrollToBlog,
                    isBlog: true,
                  },
                  {
                    label: "Links",
                    onClick: isScrolledToLinks
                      ? handleBackToTop
                      : handleScrollToLinks,
                    isLinks: true,
                  },
                  { label: "Docs", href: "https://docs.askloyal.com/" },
                  {
                    label: "Changelog",
                    onClick: () => {
                      if (typeof window !== "undefined" && window.Productlane) {
                        window.Productlane.open("CHANGELOG");
                      }
                    },
                  },
                ].map((item, index) => (
                  <button
                    key={item.label}
                    onClick={
                      item.href
                        ? () =>
                            window.open(
                              item.href,
                              "_blank",
                              "noopener,noreferrer"
                            )
                        : item.onClick
                    }
                    onMouseEnter={() => setHoveredNavIndex(index)}
                    ref={(el) => {
                      navItemRefs.current[index] = el;
                    }}
                    style={{
                      position: "relative",
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: 400,
                      padding: "0.5rem 1rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      outline: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.375rem",
                      zIndex: 1,
                      filter:
                        (item.isAbout && isScrolledToAbout) ||
                        (item.isRoadmap && isScrolledToRoadmap) ||
                        (item.isBlog && isScrolledToBlog) ||
                        (item.isLinks && isScrolledToLinks)
                          ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))"
                          : "none",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isRoadmap && isScrolledToRoadmap) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? 1
                            : 0,
                        transform:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isRoadmap && isScrolledToRoadmap) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "scale(1) translateY(0)"
                            : "scale(0.8) translateY(4px)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "relative"
                            : "absolute",
                        pointerEvents:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "auto"
                            : "none",
                      }}
                    >
                      {(item.isAbout || item.isRoadmap || item.isBlog || item.isLinks) && (
                        <ArrowUpToLine size={18} />
                      )}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isRoadmap && isScrolledToRoadmap) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? 0
                            : 1,
                        transform:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isRoadmap && isScrolledToRoadmap) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "scale(0.8) translateY(-4px)"
                            : "scale(1) translateY(0)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "absolute"
                            : "relative",
                        pointerEvents:
                          (item.isAbout && isScrolledToAbout) ||
                          (item.isBlog && isScrolledToBlog) ||
                          (item.isLinks && isScrolledToLinks)
                            ? "none"
                            : "auto",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* Sidebar Container - Fixed position on left */}
          <div
            style={{
              position: "fixed",
              top: "8px",
              left: "8px",
              bottom: "8px",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "0",
              pointerEvents: "none",
            }}
          >
            {/* Collapsed State - Icon Buttons */}
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                bottom: "0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "8px 0",
                opacity: isSidebarOpen ? 0 : 1,
                pointerEvents: isSidebarOpen ? "none" : "auto",
                transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Top buttons group */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Menu Button */}
                <button
                  className="sidebar-icon-btn"
                  onClick={() => setIsSidebarOpen(true)}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    color: "#fff",
                  }}
                  title="Open menu"
                >
                  <MenuIcon
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    ref={menuIconRef}
                    size={24}
                  />
                </button>

                {/* New Chat Button */}
                <button
                  className="sidebar-icon-btn"
                  onClick={() => {
                    setIsChatModeLocal(false);
                    setPendingText("");
                    setMessages([]);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    color: "#fff",
                  }}
                  title="New chat"
                >
                  <PlusIcon
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    ref={plusIconRef}
                    size={24}
                  />
                </button>

                {/* Feedback Button */}
                <button
                  className="sidebar-icon-btn"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.Productlane) {
                      window.Productlane.open("INDEX");
                    }
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    color: "#fff",
                  }}
                  title="Feedback and support"
                >
                  <ShieldQuestionMark size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Wallet Button - Bottom (only visible in chat mode when connected, hidden on mobile) */}
              {isChatMode && isConnected && (
                <button
                  className="sidebar-icon-btn sidebar-wallet-btn"
                  onClick={() => open()}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    padding: "4px",
                  }}
                  title={truncatedAddress || "Wallet"}
                >
                  <img
                    alt="Wallet"
                    height={28}
                    src="/Wallet-Icon.svg"
                    width={28}
                  />
                </button>
              )}
            </div>

            {/* Expanded Sidebar Panel */}
            <div
              style={{
                width: "298px",
                height: "100%",
                background: "rgba(38, 38, 38, 0.7)",
                backdropFilter: "blur(48px)",
                borderRadius: "16px",
                boxShadow:
                  "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                mixBlendMode: "luminosity",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-110%)",
                opacity: isSidebarOpen ? 1 : 0,
                transition:
                  "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: isSidebarOpen ? "auto" : "none",
              }}
            >
              {/* Panel Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px",
                }}
              >
                {/* Close Button */}
                <button
                  className="sidebar-icon-btn"
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    color: "#fff",
                  }}
                >
                  <X size={24} />
                </button>

                {/* New Chat Button */}
                <button
                  className="sidebar-icon-btn"
                  onClick={() => {
                    setIsChatModeLocal(false);
                    setPendingText("");
                    setMessages([]);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(48px)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    mixBlendMode: "lighten",
                    color: "#fff",
                    padding: "6px 16px 6px 6px",
                  }}
                >
                  <PlusIcon
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    ref={plusIconRef}
                    size={24}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: "20px",
                    }}
                  >
                    New Chat
                  </span>
                </button>
              </div>

              {/* History Section */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  padding: "0 8px",
                }}
              >
                {/* History Header */}
                <div
                  style={{
                    padding: "12px 12px 8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 500,
                      lineHeight: "20px",
                      color: "#fff",
                      letterSpacing: "-0.176px",
                    }}
                  >
                    History
                  </span>
                </div>

                {/* History List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {/* Current conversation - highlighted when in chat mode */}
                  {isChatMode && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "36px",
                        padding: "0 12px",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        background: "rgba(255, 255, 255, 0.06)",
                        boxShadow:
                          "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                        mixBlendMode: "lighten",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "20px",
                          color: "#fff",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {messages.length > 0 && messages[0]?.role === "user"
                          ? messages[0].parts
                              .filter((part) => part.type === "text")
                              .map((part) => part.text)
                              .join("")
                              .slice(0, 40) +
                            (messages[0].parts
                              .filter((part) => part.type === "text")
                              .map((part) => part.text)
                              .join("").length > 40
                              ? "..."
                              : "")
                          : "New conversation"}
                      </span>
                    </div>
                  )}
                  {previousChats.map((chat) => (
                    <div
                      className="sidebar-history-item"
                      key={chat.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "36px",
                        padding: "0 12px",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "20px",
                          color: "#fff",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {chat.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallet Container - Bottom (only visible in chat mode when connected) */}
              {isChatMode && isConnected && (
                <div
                  style={{
                    padding: "8px",
                  }}
                >
                  <button
                    className="sidebar-icon-btn"
                    onClick={() => open()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.06)",
                      backdropFilter: "blur(48px)",
                      border: "none",
                      borderRadius: "32px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                      mixBlendMode: "lighten",
                      padding: "4px",
                    }}
                  >
                    <img
                      alt="Wallet"
                      height={28}
                      src="/Wallet-Icon.svg"
                      style={{
                        borderRadius: "9999px",
                      }}
                      width={28}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "20px",
                        color: "#fff",
                        paddingRight: "12px",
                      }}
                    >
                      {truncatedAddress}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile backdrop overlay */}
          {isSidebarOpen && (
            <div
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(4px)",
                zIndex: 39,
                animation: "fadeIn 0.3s ease-out",
              }}
            />
          )}

          {/* Chat container - always full screen, input position animates within */}
          <div
            onClick={(e) => {
              // Focus input when clicking on the container (but not on other elements)
              if (isChatMode && e.target === e.currentTarget) {
                inputRef.current?.focus();
              }
            }}
            style={{
              position: "absolute",
              top: "0",
              bottom: "0",
              left: "0",
              right: "0",
              marginLeft: isChatMode && isSidebarOpen ? "314px" : "0",
              transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              gap: "0",
              padding: "0",
            }}
          >
            {/* Chat messages */}
            {isChatMode && (
              <div
                className="chat-messages-container"
                onClick={(e) => {
                  // Only focus input if no text is selected
                  const selection = window.getSelection();
                  if (!selection || selection.toString().length === 0) {
                    // Focus input when clicking on the message area
                    inputRef.current?.focus();
                  }
                }}
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: "1rem",
                  padding: "60px 32px 128px",
                  animation: "fadeIn 0.5s ease-in",
                  position: "relative",
                  maxWidth: "768px",
                  margin: "0 auto",
                  width: "100%",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 68px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 68px), transparent 100%)",
                }}
              >
                {messages.map((message, messageIndex) => {
                  const messageText = message.parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join("");

                  const resolvedTimestamp =
                    message.createdAt ?? messageTimestamps[message.id];
                  const messageTime = resolvedTimestamp
                    ? new Date(resolvedTimestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  return (
                    <div
                      key={message.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          message.role === "user" ? "flex-end" : "flex-start",
                        gap: "0.5rem",
                        animation: "slideInUp 0.3s ease-out",
                        animationFillMode: "both",
                      }}
                    >
                      {/* Message content */}
                      {message.role === "user" ? (
                        <div
                          style={{
                            position: "relative",
                            padding: "8px 16px",
                            borderRadius: "20px 20px 4px 20px",
                            background: "rgba(255, 255, 255, 0.12)",
                            color: "#fff",
                            fontSize: "16px",
                            lineHeight: "24px",
                            maxWidth: "464px",
                            fontFamily: "var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {message.parts.map((part, index) =>
                            part.type === "text" ? (
                              <span key={index}>{part.text}</span>
                            ) : null
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            color: "#fff",
                            fontSize: "16px",
                            lineHeight: "28px",
                            fontFamily: "var(--font-geist-sans), sans-serif",
                          }}
                        >
                          <MarkdownRenderer content={messageText} />
                        </div>
                      )}

                      {/* Message Footer Actions */}
                      {message.role === "user" && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            height: "40px",
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {/* Copy button */}
                            <button
                              className="message-action-btn"
                              onClick={() =>
                                handleCopyMessage(message.id, messageText)
                              }
                              style={{
                                color:
                                  copiedMessageId === message.id
                                    ? "#22c55e"
                                    : "rgba(255, 255, 255, 1)",
                              }}
                              title={
                                copiedMessageId === message.id
                                  ? "Copied!"
                                  : "Copy message"
                              }
                            >
                              <CopyIcon
                                ref={(el) => {
                                  if (el) {
                                    copyIconRefs.current.set(message.id, el);
                                  }
                                }}
                                size={20}
                              />
                            </button>

                            {/* More button */}
                            <button
                              className="message-action-btn"
                              title="More options"
                            >
                              <MoreHorizontal size={20} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Assistant Message Footer Actions - only show on completed messages */}
                      {message.role === "assistant" &&
                        !(
                          messageIndex === messages.length - 1 &&
                          (status === "streaming" || status === "submitted")
                        ) && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              height: "40px",
                              width: "100%",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {/* Copy button */}
                              <button
                                className="message-action-btn"
                                onClick={() =>
                                  handleCopyMessage(message.id, messageText)
                                }
                                style={{
                                  color:
                                    copiedMessageId === message.id
                                      ? "#22c55e"
                                      : "rgba(255, 255, 255, 1)",
                                }}
                                title={
                                  copiedMessageId === message.id
                                    ? "Copied!"
                                    : "Copy message"
                                }
                              >
                                <CopyIcon
                                  ref={(el) => {
                                    if (el) {
                                      copyIconRefs.current.set(message.id, el);
                                    }
                                  }}
                                  size={20}
                                />
                              </button>

                              {/* Refresh/Regenerate button */}
                              <button
                                className="message-action-btn"
                                title="Regenerate response"
                              >
                                <RefreshCw size={20} />
                              </button>

                              {/* More button */}
                              <button
                                className="message-action-btn"
                                title="More options"
                              >
                                <MoreHorizontal size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}

                {/* Swap Transaction Widget */}
                {/* Thinking indicator */}
                {status === "submitted" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingBottom: "8px",
                      animation: "slideInUp 0.3s ease-out",
                      animationFillMode: "both",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-geist-sans), sans-serif",
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "28px",
                        backgroundImage:
                          "linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 100%)",
                        backgroundSize: "200% 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "thinkingShimmer 2s ease-in-out infinite",
                      }}
                    >
                      Thinking
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} style={{ height: "1rem" }} />
              </div>
            )}

            {/* Scroll to bottom button - positioned above input */}
            {isChatMode && (
              <button
                aria-label="Scroll to bottom"
                className="scroll-to-bottom-button"
                onClick={handleScrollToBottom}
                onMouseEnter={(e) => {
                  if (showScrollButton) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (showScrollButton) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                  }
                }}
                style={{
                  position: "absolute",
                  bottom: "7rem", // Positioned above the input field with more space
                  right: "2rem",
                  width: "2.5rem",
                  height: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)", // Safari support
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "50%",
                  boxShadow:
                    "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: showScrollButton ? "scale(1)" : "scale(0.8)",
                  opacity: showScrollButton ? 1 : 0,
                  visibility: showScrollButton ? "visible" : "hidden",
                  pointerEvents: showScrollButton ? "auto" : "none",
                  zIndex: 10,
                }}
                type="button"
              >
                <ArrowDownIcon
                  style={{
                    width: "1.125rem",
                    height: "1.125rem",
                    color: "#fff",
                    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                  }}
                />
              </button>
            )}

            {/* Chat Input Container - animates between center and bottom */}
            <div
              style={{
                position: isChatMode
                  ? "absolute"
                  : isInputStuckToBottom
                    ? "fixed"
                    : "absolute",
                bottom: isChatMode
                  ? "16px"
                  : isInputStuckToBottom
                    ? `${stickyInputBottomOffset}px`
                    : "50%",
                left: isInputStuckToBottom && !isChatMode ? "0" : "16px",
                right: isInputStuckToBottom && !isChatMode ? "0" : "16px",
                transform: isChatMode
                  ? "translateY(0)"
                  : isInputStuckToBottom
                    ? "translateY(0)"
                    : `translateY(calc(50% + ${parallaxOffset}px))`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: isChatMode ? "auto" : 50,
                transition: isChatMode
                  ? "bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                  : isInputStuckToBottom
                    ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s ease, right 0.3s ease, max-width 0.3s ease"
                    : "transform 0.3s ease-out",
              }}
            >
              {/* Ask Loyal logo - only visible when not in chat mode */}
              {!(isChatMode || isInputStuckToBottom) && (
                <Image
                  alt="Ask Loyal"
                  height={64}
                  src="/Askloyal.svg"
                  style={{
                    marginBottom: "32px",
                    pointerEvents: "none",
                  }}
                  width={307}
                />
              )}

              {/* "Use skills" link - scrolls to top where TransactionWidget lives */}
              {skillsEnabled && !isChatMode && isInputStuckToBottom && (
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  style={{
                    pointerEvents: "auto",
                    marginBottom: "8px",
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                    cursor: "pointer",
                    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.4)",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)"; }}
                  type="button"
                >
                  ↑ Use skills
                </button>
              )}

              {/* Input form - liquid glass style with integrated send button */}
              <form
                onSubmit={handleSubmit}
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth:
                    isInputStuckToBottom && !isChatMode ? "500px" : "768px",
                  pointerEvents: "auto",
                  transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(38, 38, 38, 0.5)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    borderRadius: "32px",
                    boxShadow:
                      "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    {/* Input field area */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "flex-end",
                        maxHeight: "368px",
                        overflow: "hidden",
                        paddingLeft: "24px",
                        paddingRight: "16px",
                        paddingTop: "16px",
                        paddingBottom: "16px",
                      }}
                    >
                      <textarea
                        onChange={(e) => {
                          setPendingText(e.target.value);

                          // Auto-resize textarea based on content
                          if (inputRef.current) {
                            inputRef.current.style.height = "auto";
                            const scrollHeight = inputRef.current.scrollHeight;
                            const maxHeight = 336; // 368 - 32 (padding)
                            if (scrollHeight > maxHeight) {
                              inputRef.current.style.height = `${maxHeight}px`;
                              inputRef.current.style.overflowY = "auto";
                            } else {
                              inputRef.current.style.height = `${scrollHeight}px`;
                              inputRef.current.style.overflowY = "hidden";
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Allow Shift+Enter to create new lines
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (hasUsableInput && !isLoading) {
                              handleSubmit(e as unknown as React.FormEvent);
                            }
                          }
                        }}
                        placeholder={
                          isOnline
                            ? isChatMode && !isConnected
                              ? "Please reconnect wallet to continue..."
                              : "Ask anything"
                            : "No internet connection..."
                        }
                        ref={inputRef}
                        rows={1}
                        style={{
                          width: "100%",
                          padding: "2px 0",
                          background: "transparent",
                          border: "none",
                          color: "white",
                          fontSize: "16px",
                          fontFamily: "var(--font-geist-sans), sans-serif",
                          lineHeight: "24px",
                          resize: "none",
                          outline: "none",
                          overflowY: "hidden",
                        }}
                        value={pendingText}
                      />
                    </div>

                    {/* Submit button wrapper */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        padding: "8px",
                        alignSelf: "stretch",
                      }}
                    >
                      <button
                        disabled={!(hasUsableInput || isLoading)}
                        onClick={(e) => {
                          e.preventDefault();
                          if (isLoading) {
                            // TODO: Implement stop functionality
                          } else if (hasUsableInput) {
                            handleSubmit(e as unknown as React.FormEvent);
                          }
                        }}
                        style={{
                          width: "44px",
                          height: "44px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            hasUsableInput || isLoading
                              ? "rgba(255, 255, 255, 0.06)"
                              : "rgba(0, 0, 0, 0.3)",
                          border: "none",
                          borderRadius: "9999px",
                          cursor:
                            hasUsableInput || isLoading
                              ? "pointer"
                              : "not-allowed",
                          outline: "none",
                          transition: "all 0.2s ease",
                          boxShadow:
                            hasUsableInput || isLoading
                              ? "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)"
                              : "none",
                          mixBlendMode:
                            hasUsableInput || isLoading ? "lighten" : "normal",
                        }}
                        type="button"
                      >
                        {isLoading ? (
                          <img
                            alt="Stop"
                            height={24}
                            src="/send_stop.svg"
                            width={24}
                          />
                        ) : hasUsableInput ? (
                          <img
                            alt="Send"
                            height={24}
                            src="/send_enabled.svg"
                            width={24}
                          />
                        ) : (
                          <img
                            alt="Send"
                            height={24}
                            src="/send_disabled.svg"
                            width={24}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Transaction widget - drag & drop tokens below input when not scrolled */}
              {skillsEnabled && !isChatMode && !isInputStuckToBottom && (
                <div
                  className="mt-4"
                  style={{
                    pointerEvents: "auto",
                    width: "100%",
                    maxWidth: "768px",
                  }}
                >
                  <TransactionWidget
                    onTransactionComplete={handleTransactionWidgetComplete}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* End of first section */}

        {/* BentoGrid Section - Only show when not in chat mode */}
        {!isChatMode && <BentoGridSection />}

        {/* Roadmap Section - Only show when not in chat mode */}
        {!isChatMode && <RoadmapSection />}

        {/* Blog Section - Only show when not in chat mode */}
        {!isChatMode && <BlogSection />}
        {!isChatMode && <Footer />}
      </div>

      {/* Network offline overlay */}
      {!isOnline && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              background: "rgba(255, 140, 0, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 140, 0, 0.3)",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow:
                "0 20px 60px 0 rgba(255, 140, 0, 0.2), " +
                "inset 0 2px 4px rgba(255, 255, 255, 0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              📡
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: "1rem",
              }}
            >
              No Internet Connection
            </h3>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "1rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Your internet connection has been lost. The input will be
              automatically restored when you&apos;re back online.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.875rem",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "rgba(255, 140, 0, 0.8)",
                  borderRadius: "50%",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              Waiting for connection...
            </div>
          </div>
        </div>
      )}

      {/* Modal for testers message */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
            }}
          />

          {/* Modal content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "24px",
              padding: "2.5rem",
              boxShadow:
                "0 20px 60px 0 rgba(0, 0, 0, 0.5), " +
                "inset 0 2px 4px rgba(255, 255, 255, 0.1), " +
                "inset 0 -1px 2px rgba(0, 0, 0, 0.3)",
              animation: "slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Modal header */}
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: "1.5rem",
                lineHeight: 1.3,
              }}
            >
              Thank you for joining Loyal open test!
            </h2>

            {/* Modal body */}
            <div
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "1rem",
                lineHeight: 1.7,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong style={{ color: "#fff", fontWeight: 600 }}>
                  What is it:
                </strong>{" "}
                you&apos;re looking at fully private on-chain AI. Every message
                is encrypted and facilitated on-chain with AI itself running in
                confidential VM. Neither Loyal devs nor compute node owners can
                access your data.
              </p>

              <p style={{ margin: 0 }}>
                For this open test, there&apos;s no per-query fee but the wallet
                verification is required.
              </p>

              <p style={{ margin: 0 }}>
                <strong style={{ color: "#ef4444", fontWeight: 600 }}>
                  WARNING:
                </strong>{" "}
                this is an early stage product and some features may be
                incomplete or contain errors.
              </p>

              <p style={{ margin: 0 }}>
                You will help our cause if you report any bugs/drop your
                feedback or ideas in our discord community:{" "}
                <a
                  href="https://discord.askloyal.com"
                  rel="noopener noreferrer"
                  style={{
                    color: "#60a5fa",
                    textDecoration: "underline",
                  }}
                  target="_blank"
                >
                  https://discord.askloyal.com
                </a>
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.border =
                  "1px solid rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 24px 0 rgba(0, 0, 0, 0.4), " +
                  "inset 0 1px 2px rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.border =
                  "1px solid rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px 0 rgba(0, 0, 0, 0.3), " +
                  "inset 0 1px 2px rgba(255, 255, 255, 0.1)";
              }}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fff",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 20px 0 rgba(0, 0, 0, 0.3), " +
                  "inset 0 1px 2px rgba(255, 255, 255, 0.1)",
              }}
            >
              I understand
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDownSimple {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes thinkingShimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: -100% 50%;
          }
        }

        .message-action-btn {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          color: rgba(255, 255, 255, 1);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(48px);
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.04),
            0px 2px 4px 0px rgba(0, 0, 0, 0.02);
          mix-blend-mode: lighten;
        }

        .sidebar-icon-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }

        @keyframes subtlePulse {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 2px 10px rgba(255, 68, 68, 0.2);
          }
          50% {
            transform: translateX(-50%) scale(1.03);
            box-shadow: 0 4px 15px rgba(255, 68, 68, 0.35);
          }
        }

        @keyframes tooltipFadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Custom scrollbar for textarea */
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          opacity: 0.48;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        textarea {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        /* Custom scrollbar for chat messages */
        .chat-messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .chat-messages-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin: 10px 0;
        }

        .chat-messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Firefox custom scrollbar */
        .chat-messages-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        /* Mobile styles for chat */
        @media (max-width: 767px) {
          .chat-messages-container {
            padding-left: 56px !important;
          }
          .sidebar-wallet-btn {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}

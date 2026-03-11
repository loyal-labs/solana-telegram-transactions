"use client";

import { ArrowUpRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import Image from "next/image";

import type { RightSidebarTab } from "@/components/wallet-sidebar";

export interface ChatInputProps {
  isChatMode: boolean;
  isInputStuckToBottom: boolean;
  stickyInputBottomOffset: number;
  parallaxOffset: number;
  pendingText: string;
  onPendingTextChange: (text: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  hasUsableInput: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  isOnline: boolean;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  onOpenRightSidebar: (tab: RightSidebarTab) => void;
}

export function ChatInput(props: ChatInputProps) {
  const isBalanceHidden = props.isBalanceHidden;

  return (
    <>
      {/* SVG pixelation filters for balance hiding */}
      <svg
        aria-hidden="true"
        height="0"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
        width="0"
      >
        <defs>
          {/* Large pixel filter for main dollar balance */}
          <filter id="pixelate-lg" x="0" y="0" width="100%" height="100%">
            <feFlood x="4" y="4" height="2" width="2" />
            <feComposite width="10" height="10" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="5" />
          </filter>
          {/* Smaller pixel filter for SOL balance */}
          <filter id="pixelate-sm" x="0" y="0" width="100%" height="100%">
            <feFlood x="3" y="3" height="2" width="2" />
            <feComposite width="8" height="8" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="4" />
          </filter>
        </defs>
      </svg>

      {/* Chat Input Container - animates between center and bottom */}
      <div
        style={{
          position: props.isChatMode
            ? "absolute"
            : props.isInputStuckToBottom
            ? "fixed"
            : "absolute",
          bottom: props.isChatMode
            ? "16px"
            : props.isInputStuckToBottom
            ? `${props.stickyInputBottomOffset}px`
            : "50%",
          left: props.isInputStuckToBottom && !props.isChatMode ? "0" : "16px",
          right: props.isInputStuckToBottom && !props.isChatMode ? "0" : "16px",
          transform: props.isChatMode
            ? "translateY(0)"
            : props.isInputStuckToBottom
            ? "translateY(0)"
            : `translateY(calc(50% - 17px + ${props.parallaxOffset}px))`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: props.isChatMode ? "auto" : 50,
          transition: props.isChatMode
            ? "bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : props.isInputStuckToBottom
            ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s ease, right 0.3s ease, max-width 0.3s ease"
            : "transform 0.3s ease-out",
        }}
      >
        {/* Dog illustration */}
        {!props.isChatMode && !props.isInputStuckToBottom && (
          <div
            style={{
              width: "160px",
              height: "128px",
              marginBottom: "-18px",
              pointerEvents: "none",
            }}
          >
            <Image
              alt="Loyal Dog"
              height={128}
              src="/hero-new/Dog.svg"
              style={{ width: "100%", height: "100%" }}
              width={160}
            />
          </div>
        )}

        {/* Input form - liquid glass style with integrated send button */}
        <form
          onSubmit={props.onSubmit}
          style={{
            position: "relative",
            width: "100%",
            maxWidth:
              props.isInputStuckToBottom && !props.isChatMode
                ? "500px"
                : "768px",
            pointerEvents: "auto",
            transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              background: "rgba(241, 241, 241, 0.7)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRadius: "32px",
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
                    props.onPendingTextChange(e.target.value);

                    // Auto-resize textarea based on content
                    if (props.inputRef.current) {
                      props.inputRef.current.style.height = "auto";
                      const scrollHeight = props.inputRef.current.scrollHeight;
                      const maxHeight = 336; // 368 - 32 (padding)
                      if (scrollHeight > maxHeight) {
                        props.inputRef.current.style.height = `${maxHeight}px`;
                        props.inputRef.current.style.overflowY = "auto";
                      } else {
                        props.inputRef.current.style.height = `${scrollHeight}px`;
                        props.inputRef.current.style.overflowY = "hidden";
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow Shift+Enter to create new lines
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (props.hasUsableInput && !props.isLoading) {
                        props.onSubmit(e as unknown as React.FormEvent);
                      }
                    }
                  }}
                  placeholder={
                    props.isOnline
                      ? props.isChatMode && !props.isSignedIn
                        ? "Please sign in to continue..."
                        : "Ask Loyal anything"
                      : "No internet connection..."
                  }
                  ref={props.inputRef}
                  rows={1}
                  style={{
                    width: "100%",
                    padding: "2px 0",
                    background: "transparent",
                    border: "none",
                    color: "#000",
                    fontSize: "16px",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    lineHeight: "24px",
                    resize: "none",
                    outline: "none",
                    overflowY: "hidden",
                  }}
                  value={props.pendingText}
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
                  disabled={!(props.hasUsableInput || props.isLoading)}
                  onClick={(e) => {
                    e.preventDefault();
                    if (props.isLoading) {
                      // TODO: Implement stop functionality
                    } else if (props.hasUsableInput) {
                      props.onSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  style={{
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F9363C",
                    opacity: props.hasUsableInput || props.isLoading ? 1 : 0.4,
                    border: "none",
                    borderRadius: "9999px",
                    cursor:
                      props.hasUsableInput || props.isLoading
                        ? "pointer"
                        : "not-allowed",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxShadow:
                      props.hasUsableInput || props.isLoading
                        ? "0px 4px 8px 0px rgba(0, 0, 0, 0.04), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)"
                        : "none",
                    mixBlendMode: "normal",
                  }}
                  type="button"
                >
                  {props.isLoading ? (
                    <img
                      alt="Stop"
                      height={24}
                      src="/send_stop.svg"
                      width={24}
                    />
                  ) : props.hasUsableInput ? (
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

        {/* Wallet + Action Cards */}
        {!props.isChatMode && !props.isInputStuckToBottom && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: "100%",
              maxWidth: "768px",
              padding: "0 16px",
              marginTop: "28px",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                padding: "16px 16px 12px",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  border: "0.533px solid rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image
                  alt="Wallet"
                  height={64}
                  src="/hero-new/Wallet-Cover.png"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  width={64}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgba(60, 60, 67, 0.6)",
                    fontFeatureSettings: "'liga' off, 'clig' off",
                  }}
                >
                  UQAt…qZir · Mainnet
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ borderRadius: "8px", overflow: "hidden" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-sans), sans-serif",
                        fontSize: "28px",
                        fontWeight: 600,
                        lineHeight: "32px",
                        color: isBalanceHidden ? "#BBBBC0" : "#000",
                        fontFeatureSettings: "'liga' off, 'clig' off",
                        filter: isBalanceHidden ? "url(#pixelate-lg)" : "none",
                        transition: "filter 0.15s ease, color 0.15s ease",
                        userSelect: isBalanceHidden ? "none" : "auto",
                        display: "block",
                      }}
                    >
                      $1,267
                      <span
                        style={{
                          color: isBalanceHidden
                            ? "#BBBBC0"
                            : "rgba(60, 60, 67, 0.6)",
                          transition: "color 0.15s ease",
                        }}
                      >
                        .47
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => props.onBalanceHiddenChange(!isBalanceHidden)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                    type="button"
                  >
                    {isBalanceHidden ? (
                      <EyeOff
                        size={28}
                        strokeWidth={1.75}
                        style={{ color: "rgba(60, 60, 67, 0.6)" }}
                      />
                    ) : (
                      <Eye
                        size={28}
                        strokeWidth={1.75}
                        style={{ color: "rgba(60, 60, 67, 0.6)" }}
                      />
                    )}
                  </button>
                </div>
                <div style={{ borderRadius: "6px", overflow: "hidden" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-sans), sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "20px",
                      color: isBalanceHidden
                        ? "#C8C8CC"
                        : "rgba(60, 60, 67, 0.6)",
                      fontFeatureSettings: "'liga' off, 'clig' off",
                      filter: isBalanceHidden ? "url(#pixelate-sm)" : "none",
                      transition: "filter 0.15s ease, color 0.15s ease",
                      userSelect: isBalanceHidden ? "none" : "auto",
                      display: "block",
                    }}
                  >
                    14.98765 SOL
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "116px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "16px 16px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                }}
                className="action-card"
                onClick={() => props.onOpenRightSidebar("portfolio")}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingRight: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "90px",
                      border: "2px solid white",
                      overflow: "hidden",
                      marginRight: "-10px",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Image
                      alt="USDC"
                      height={36}
                      src="/hero-new/usdc.png"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      width={36}
                    />
                  </div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "90px",
                      border: "2px solid white",
                      overflow: "hidden",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Image
                      alt="SOL"
                      height={36}
                      src="/hero-new/solana.png"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      width={36}
                    />
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgba(60, 60, 67, 0.6)",
                    fontFeatureSettings: "'liga' off, 'clig' off",
                  }}
                >
                  Portfolio
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  height: "116px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "16px 16px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                }}
                className="action-card"
                onClick={() => props.onOpenRightSidebar("send")}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    background: "rgba(249, 54, 60, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowUpRight size={20} style={{ color: "#F9363C" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgba(60, 60, 67, 0.6)",
                    fontFeatureSettings: "'liga' off, 'clig' off",
                  }}
                >
                  Send
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  height: "116px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "16px 16px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                }}
                className="action-card"
                onClick={() => props.onOpenRightSidebar("swap")}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    background: "rgba(249, 54, 60, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RefreshCw size={20} style={{ color: "#F9363C" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgba(60, 60, 67, 0.6)",
                    fontFeatureSettings: "'liga' off, 'clig' off",
                  }}
                >
                  Swap
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Custom scrollbar for textarea */
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          opacity: 0.48;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }
        textarea {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
        }

        input::placeholder,
        textarea::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }

        .action-card {
          transition: background-color 0.3s ease;
          cursor: pointer;
        }
        .action-card:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
}

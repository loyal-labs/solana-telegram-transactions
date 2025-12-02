"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { ChevronRight } from "lucide-react";

// Mock chat data - placeholder for now
const MOCK_CHATS = [
  { id: "1", title: "Telegram Developers Community" },
  { id: "2", title: "X Live 🎻 classic" },
  { id: "3", title: "Gift Concepts" },
  { id: "4", title: "TON Community" },
  { id: "5", title: "Solana Developers" },
  { id: "6", title: "UX Live 🎻 classic" },
  { id: "7", title: "Crypto Trading" },
  { id: "8", title: "Web3 Builders" },
  { id: "9", title: "DeFi Discussion" },
  { id: "10", title: "NFT Collectors" },
  { id: "11", title: "Blockchain News" },
  { id: "12", title: "Smart Contracts" },
];

// Generate a consistent color based on the chat title
function getAvatarColor(title: string): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
    "#BB8FCE", // Purple
    "#85C1E9", // Light Blue
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Get the first letter of the title (skip emojis)
function getFirstLetter(title: string): string {
  // Remove emojis and get first alphanumeric character
  const cleaned = title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "").trim();
  return cleaned.charAt(0).toUpperCase() || title.charAt(0).toUpperCase();
}

interface ChatItemProps {
  chat: { id: string; title: string };
  onClick: () => void;
}

function ChatItem({ chat, onClick }: ChatItemProps) {
  const avatarColor = getAvatarColor(chat.title);
  const firstLetter = getFirstLetter(chat.title);

  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-3 py-1.5 rounded-2xl active:opacity-80 transition-opacity text-left"
    >
      {/* Avatar */}
      <div className="pr-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          <span className="text-lg font-medium text-white">{firstLetter}</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 py-2.5 min-w-0">
        <p className="text-base text-white leading-5 truncate">{chat.title}</p>
      </div>

      {/* Chevron */}
      <div className="pl-3 flex items-center">
        <ChevronRight size={16} strokeWidth={1.5} className="text-white/60" />
      </div>
    </button>
  );
}

export default function SummariesPage() {
  const handleChatClick = (chatId: string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // TODO: Navigate to chat summary details
    console.log("Chat clicked:", chatId);
  };

  return (
    <main
      className="min-h-screen text-white font-sans overflow-hidden relative flex flex-col"
      style={{ background: "#16161a" }}
    >
      {/* Header */}
      <div
        className="px-4"
        style={{ paddingTop: "calc(var(--app-safe-top, 20px) + 16px)" }}
      >
        <h1 className="text-xl font-medium text-white leading-6 py-3">Chats</h1>
      </div>

      {/* Chat List or Empty State */}
      {MOCK_CHATS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 pt-6">
          <p className="text-base text-white/60 leading-5 text-center">
            No summarized chats yet
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col pt-1 pb-4 px-0 overflow-y-auto">
          {MOCK_CHATS.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              onClick={() => handleChatClick(chat.id)}
            />
          ))}

          {/* Bottom padding for navigation */}
          <div className="h-32 shrink-0" />
        </div>
      )}
    </main>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import SummaryFeed from "@/components/summaries/SummaryFeed";

function SummaryFeedContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId") || undefined;

  return <SummaryFeed initialChatId={chatId} />;
}

export default function SummaryFeedPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "#16161a" }}
        >
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      }
    >
      <SummaryFeedContent />
    </Suspense>
  );
}

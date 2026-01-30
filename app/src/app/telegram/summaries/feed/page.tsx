"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { useSummaries } from "@/components/summaries/SummariesContext";
import SummaryFeed from "@/components/summaries/SummaryFeed";

function SummaryFeedContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId") || undefined;
  const { summaries: allSummaries } = useSummaries();

  // Find the group title from the selected summary
  const groupTitle = useMemo(() => {
    if (!chatId || allSummaries.length === 0) return undefined;
    const selectedSummary = allSummaries.find((s) => s.id === chatId);
    return selectedSummary?.title;
  }, [chatId, allSummaries]);

  // Filter summaries to only include those from the same group
  const groupSummaries = useMemo(() => {
    if (!groupTitle || allSummaries.length === 0) return undefined;
    return allSummaries.filter((s) => s.title === groupTitle);
  }, [groupTitle, allSummaries]);

  // Pass filtered summaries for the specific group
  return (
    <SummaryFeed
      initialChatId={chatId}
      summaries={groupSummaries}
      groupTitle={groupTitle}
    />
  );
}

export default function SummaryFeedPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "#000" }}
        >
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      }
    >
      <SummaryFeedContent />
    </Suspense>
  );
}

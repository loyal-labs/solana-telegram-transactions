"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ChatSummary } from "./SummaryFeed";

const STORAGE_KEY = "summaries_cache";

type SummariesContextType = {
  summaries: ChatSummary[];
  setSummaries: (summaries: ChatSummary[]) => void;
  hasCachedData: boolean;
};

const SummariesContext = createContext<SummariesContextType>({
  summaries: [],
  setSummaries: () => {},
  hasCachedData: false,
});

function loadFromSession(): ChatSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

export function SummariesProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummariesState] = useState<ChatSummary[]>([]);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    const cached = loadFromSession();
    if (cached.length > 0) {
      setSummariesState(cached);
      setHasCachedData(true);
    }
  }, []);

  const setSummaries = useCallback((newSummaries: ChatSummary[]) => {
    setSummariesState(newSummaries);
    setHasCachedData(newSummaries.length > 0);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSummaries));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  const value = useMemo(
    () => ({ summaries, setSummaries, hasCachedData }),
    [summaries, setSummaries, hasCachedData]
  );

  return (
    <SummariesContext.Provider value={value}>
      {children}
    </SummariesContext.Provider>
  );
}

export function useSummaries(): SummariesContextType {
  return useContext(SummariesContext);
}

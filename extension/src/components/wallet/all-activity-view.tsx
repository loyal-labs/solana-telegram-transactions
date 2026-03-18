import { useState } from "react";

import type {
  ActivityRow,
  SubView,
  TransactionDetail,
} from "@loyal-labs/wallet-core/types";

import { ActivityRowItem } from "~/src/components/wallet/activity-row-item";
import { SearchInput, SubViewHeader } from "~/src/components/wallet/shared";

export function AllActivityView({
  activities,
  details,
  isBalanceHidden,
  onBack,
  onNavigate,
}: {
  activities: ActivityRow[];
  details: Record<string, TransactionDetail>;
  isBalanceHidden: boolean;
  onBack: () => void;
  onNavigate: (view: SubView) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = activities.filter(
    (a) =>
      a.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      a.amount.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()),
  );

  // Group by date
  const grouped: { date: string; items: ActivityRow[] }[] = [];
  for (const item of filtered) {
    const existing = grouped.find((g) => g.date === item.date);
    if (existing) {
      existing.items.push(item);
    } else {
      grouped.push({ date: item.date, items: [item] });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader onBack={onBack} title="Activity" />
      <SearchInput onChange={setSearch} value={search} />
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-2">
        {grouped.map((group) => (
          <div key={group.date}>
            {/* Date header */}
            <div className="px-3 pt-3 pb-2">
              <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
                {group.date}
              </span>
            </div>
            {group.items.map((activity) => (
              <ActivityRowItem
                activity={{ ...activity, timestamp: activity.timestamp }}
                isBalanceHidden={isBalanceHidden}
                key={activity.id}
                onClick={() =>
                  onNavigate({
                    type: "transaction",
                    detail: details[activity.id],
                    from: "allActivity",
                  })
                }
              />
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="py-8 text-center font-sans text-sm text-gray-400">
            No activity found
          </div>
        )}
      </div>
    </div>
  );
}

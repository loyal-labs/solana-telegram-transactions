import {
  getAvailableDates,
  getTopicsForDate,
  groupSummariesByDate,
  toDateKey,
} from "../summary-utils";

describe("toDateKey", () => {
  it("extracts YYYY-MM-DD from ISO string", () => {
    expect(toDateKey("2026-02-23T10:00:00Z")).toBe("2026-02-23");
  });
});

describe("groupSummariesByDate", () => {
  const summaries = [
    { id: "1", title: "A", topics: [], createdAt: "2026-02-23T10:00:00Z" },
    { id: "2", title: "A", topics: [], createdAt: "2026-02-23T15:00:00Z" },
    { id: "3", title: "A", topics: [], createdAt: "2026-02-22T10:00:00Z" },
  ];

  it("groups by date key", () => {
    const grouped = groupSummariesByDate(summaries);
    expect(grouped.get("2026-02-23")).toHaveLength(2);
    expect(grouped.get("2026-02-22")).toHaveLength(1);
  });
});

describe("getAvailableDates", () => {
  it("returns unique dates sorted newest first", () => {
    const summaries = [
      { id: "1", title: "A", topics: [], createdAt: "2026-02-21T10:00:00Z" },
      { id: "2", title: "A", topics: [], createdAt: "2026-02-23T10:00:00Z" },
      { id: "3", title: "A", topics: [], createdAt: "2026-02-22T10:00:00Z" },
    ];
    expect(getAvailableDates(summaries)).toEqual([
      "2026-02-23",
      "2026-02-22",
      "2026-02-21",
    ]);
  });
});

describe("getTopicsForDate", () => {
  it("returns flattened topics for a given date", () => {
    const summaries = [
      {
        id: "1",
        title: "A",
        createdAt: "2026-02-23T10:00:00Z",
        topics: [
          { id: "t1", title: "Topic 1", content: "c1", sources: ["Alice"] },
        ],
      },
      {
        id: "2",
        title: "A",
        createdAt: "2026-02-23T15:00:00Z",
        topics: [
          { id: "t2", title: "Topic 2", content: "c2", sources: ["Bob"] },
        ],
      },
    ];
    const grouped = groupSummariesByDate(summaries);
    const topics = getTopicsForDate(grouped, "2026-02-23");
    expect(topics).toHaveLength(2);
    expect(topics[0].title).toBe("Topic 1");
    expect(topics[1].title).toBe("Topic 2");
  });

  it("returns empty array for missing date", () => {
    const grouped = groupSummariesByDate([]);
    expect(getTopicsForDate(grouped, "2026-01-01")).toEqual([]);
  });
});

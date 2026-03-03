import { transformSummariesToGroups } from "../api";

const MOCK_SUMMARIES = [
  {
    id: "s1",
    chatId: "group-1",
    title: "Alpha Group",
    messageCount: 42,
    createdAt: "2026-02-23T10:00:00Z",
    topics: [
      { id: "t1", title: "Topic 1", content: "Content 1", sources: ["Alice"] },
    ],
  },
  {
    id: "s2",
    chatId: "group-1",
    title: "Alpha Group",
    messageCount: 30,
    createdAt: "2026-02-22T10:00:00Z",
    topics: [
      { id: "t2", title: "Topic 2", content: "Content 2", sources: ["Bob"] },
    ],
  },
  {
    id: "s3",
    chatId: "group-2",
    title: "Beta Group",
    messageCount: 15,
    createdAt: "2026-02-23T10:00:00Z",
    topics: [
      {
        id: "t3",
        title: "Topic 3",
        content: "Content 3",
        sources: ["Carol"],
      },
    ],
  },
];

describe("transformSummariesToGroups", () => {
  it("deduplicates summaries by group chat ID, keeping most recent", () => {
    const groups = transformSummariesToGroups(MOCK_SUMMARIES);
    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe("group-1");
    expect(groups[0].subtitle).toBe("Content 1"); // from most recent summary
    expect(groups[1].id).toBe("group-2");
  });

  it("returns empty array for empty input", () => {
    expect(transformSummariesToGroups([])).toEqual([]);
  });
});

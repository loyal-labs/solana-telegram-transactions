import { describe, expect, test } from "bun:test";

import { runSummariesEval } from "../runner";

describe("runSummariesEval", () => {
  test("returns a passing report for compliant dataset", () => {
    const report = runSummariesEval();

    expect(report.passed).toBe(true);
    expect(report.metrics.structureValidityRate).toBeGreaterThanOrEqual(1);
    expect(report.metrics.sourceAttributionValidityRate).toBeGreaterThanOrEqual(1);
    expect(report.metrics.topicCountComplianceRate).toBeGreaterThanOrEqual(1);
    expect(report.metrics.onelinerLengthComplianceRate).toBeGreaterThanOrEqual(1);
  });

  test("throws when metric rates drop below threshold", () => {
    const badDataset = {
      datasetId: "summaries-v1",
      version: "v1",
      cases: [
        {
          id: "bad-case",
          output: {
            oneliner: " ",
            topics: [],
          },
          participants: ["alice"],
        },
      ],
    } as const;

    const baseline = {
      datasetId: "summaries-v1",
      minimumRates: {
        onelinerLengthComplianceRate: 1,
        sourceAttributionValidityRate: 1,
        structureValidityRate: 1,
        topicCountComplianceRate: 1,
      },
    } as const;

    expect(() => runSummariesEval(badDataset as never, baseline as never)).toThrow(
      "Summary eval regression detected"
    );
  });
});

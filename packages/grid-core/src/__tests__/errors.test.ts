import { describe, expect, test } from "bun:test";

import {
  extractGridErrorMessage,
  extractGridSessionUrl,
  parseGridErrorDetails,
} from "../errors";

describe("grid error helpers", () => {
  test("extracts normalized message, details, and session url", () => {
    const payload = {
      error: {
        message: "Upstream failed",
        details: [{ field: "slotNumber", code: "invalid", message: "Bad slot" }],
      },
      data: {
        url: "https://auth.askloyal.com/continue?foo=bar",
      },
    };

    expect(extractGridErrorMessage(payload)).toBe("Upstream failed");
    expect(parseGridErrorDetails(payload)).toEqual([
      "slotNumber (invalid): Bad slot",
    ]);
    expect(extractGridSessionUrl(payload)).toBe(
      "https://auth.askloyal.com/continue?foo=bar"
    );
  });
});

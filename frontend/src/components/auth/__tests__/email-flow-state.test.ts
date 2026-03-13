import { describe, expect, test } from "bun:test";

import {
  createInitialEmailFlowState,
  emailFlowReducer,
} from "@/components/auth/email-flow-state";

describe("email flow reducer", () => {
  test("moves from idle to captcha and then awaiting otp", () => {
    const initial = createInitialEmailFlowState();
    const captchaState = emailFlowReducer(
      {
        ...initial,
        email: "user@example.com",
      },
      { type: "continueRequested" }
    );
    const otpState = emailFlowReducer(captchaState, {
      type: "submitSucceeded",
      authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
    });

    expect(captchaState.status).toBe("captcha");
    expect(otpState.status).toBe("awaitingOtp");
    expect(otpState.authTicketId).toBe(
      "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4"
    );
  });

  test("returns to awaiting otp with error details after verify failure", () => {
    const state = emailFlowReducer(
      {
        ...createInitialEmailFlowState(),
        status: "awaitingOtp",
        email: "user@example.com",
        authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
      },
      {
        type: "verifyFailed",
        error: {
          message: "The verification code is invalid or expired.",
          details: ["Try again."],
        },
      }
    );

    expect(state.status).toBe("awaitingOtp");
    expect(state.errorMessage).toBe("The verification code is invalid or expired.");
    expect(state.errorDetails).toEqual(["Try again."]);
  });
});

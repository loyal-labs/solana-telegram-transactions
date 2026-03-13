import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { resolveLlmProviderConfig } from "@loyal-labs/llm-core";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  extractMessageText,
  recordAssistantReply,
} from "@/features/chat/server/chat-persistence";
import { prepareChatTurn } from "@/features/chat/server/chat-service";
import {
  isAuthGatewayError,
  resolveAuthenticatedPrincipalFromRequest,
} from "@/features/identity/server/auth-session";
import { getServerEnv } from "@/lib/core/config/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const DEFAULT_MODEL_ID = "loyal-oracle";
const LOYAL_ORACLE_PROVIDER_NAME = "loyal-oracle";
const REDPILL_API_BASE_URL = "https://api.redpill.ai/v1/";

type ChatRequestBody = {
  id: string;
  messageId?: string;
  messages: UIMessage[];
};

type SubmittedChatTurn = {
  message: UIMessage;
  text: string;
  turnId: string;
};

function isChatRequestBody(value: unknown): value is ChatRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    Array.isArray(record.messages) &&
    (record.messageId === undefined || typeof record.messageId === "string")
  );
}

function getLatestUserMessage(body: ChatRequestBody): UIMessage | null {
  if (body.messageId) {
    const matchedMessage = body.messages.find(
      (message) => message.id === body.messageId && message.role === "user"
    );
    if (matchedMessage) {
      return matchedMessage;
    }
  }

  return (
    body.messages
      .slice()
      .reverse()
      .find((message) => message.role === "user") ?? null
  );
}

function getSubmittedChatTurn(body: ChatRequestBody): SubmittedChatTurn | null {
  const message = getLatestUserMessage(body);
  if (!message) {
    return null;
  }

  const text = extractMessageText(message);
  if (!text) {
    return null;
  }

  return {
    message,
    text,
    turnId: body.messageId ?? message.id,
  };
}

export async function POST(req: Request) {
  const payload = (await req.json()) as unknown;
  if (!isChatRequestBody(payload)) {
    return new Response("Invalid request payload", { status: 400 });
  }

  let principal: Awaited<
    ReturnType<typeof resolveAuthenticatedPrincipalFromRequest>
  >;
  try {
    principal = await resolveAuthenticatedPrincipalFromRequest(req);
  } catch (error) {
    if (isAuthGatewayError(error)) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    throw error;
  }

  const submittedTurn = getSubmittedChatTurn(payload);
  if (!submittedTurn) {
    return new Response("No user message found to persist", { status: 400 });
  }

  if (!principal) {
    return Response.json(
      {
        error: {
          code: "unauthenticated",
          message: "Authentication is required to use chat.",
        },
      },
      { status: 401 }
    );
  }

  const { chatRuntime } = getServerEnv();
  const { config, model } = resolveLlmProviderConfig({
    defaults: {
      apiKey: chatRuntime.apiKey,
      model: DEFAULT_MODEL_ID,
    },
    overrides: {
      model: chatRuntime.modelId,
    },
    provider: {
      apiURL: REDPILL_API_BASE_URL,
      name: "openai",
    },
  });

  const customProvider = createOpenAICompatible({
    baseURL: config.apiURL,
    name: LOYAL_ORACLE_PROVIDER_NAME,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.headers ?? {}),
    },
  });

  const { chatId, turnId } = await prepareChatTurn({
    principal,
    clientChatId: payload.id,
    clientMessageId: submittedTurn.message.id,
    firstPrompt: submittedTurn.text,
    model,
    turnId: submittedTurn.turnId,
  });

  const result = streamText({
    model: customProvider.languageModel(model),
    system:
      "You are a helpful AI assistant for Loyal, a private intelligence platform.",
    messages: convertToModelMessages(payload.messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: payload.messages,
    onFinish: async ({ isAborted, responseMessage }) => {
      if (isAborted) {
        return;
      }

      await recordAssistantReply({
        chatId,
        turnId,
        content: extractMessageText(responseMessage),
      });
    },
  });
}

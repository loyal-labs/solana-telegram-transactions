import "server-only";

import { serverEnv } from "../core/config/server";
import { fetchJson } from "../core/http";
import { DEFAULT_PRIORITY_FEE_LAMPORTS, DFLOW_API_BASE_URL, SWAP_ERRORS } from "./constants";
import type {
  DFlowQuoteRequest,
  DFlowQuoteResponse,
  DFlowSwapRequest,
  DFlowSwapResponse,
} from "./types";

function getApiKey(): string {
  try {
    return serverEnv.dflowApiKey;
  } catch {
    throw new Error(SWAP_ERRORS.MISSING_API_KEY);
  }
}

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": getApiKey(),
  };
}

export async function fetchQuote(
  request: DFlowQuoteRequest
): Promise<DFlowQuoteResponse> {
  const params = new URLSearchParams({
    inputMint: request.inputMint,
    outputMint: request.outputMint,
    amount: request.amount,
    slippageBps: String(request.slippageBps),
    userPublicKey: request.userPublicKey,
  });

  const url = `${DFLOW_API_BASE_URL}/quote?${params.toString()}`;

  const response = await fetchJson<DFlowQuoteResponse>(url, {
    method: "GET",
    headers: buildHeaders(),
  });

  return response;
}

export async function fetchSwapTransaction(
  quoteResponse: DFlowQuoteResponse,
  userPublicKey: string
): Promise<DFlowSwapResponse> {
  const url = `${DFLOW_API_BASE_URL}/swap`;

  const request: DFlowSwapRequest = {
    userPublicKey,
    quoteResponse,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: DEFAULT_PRIORITY_FEE_LAMPORTS,
  };

  const response = await fetchJson<DFlowSwapResponse>(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(request),
  });

  return response;
}

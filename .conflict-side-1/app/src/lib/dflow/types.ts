export type DFlowQuoteRequest = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: "auto" | number;
  userPublicKey: string;
};

export type DFlowQuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
};

export type DFlowSwapRequest = {
  userPublicKey: string;
  quoteResponse: DFlowQuoteResponse;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number | "auto";
};

export type DFlowSwapResponse = {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  prioritizationType: {
    computeBudget: {
      microLamports: number;
      estimatedMicroLamports: number;
    };
  };
  dynamicSlippageReport?: {
    slippageBps: number;
    otherAmount: number;
    simulatedIncurredSlippageBps: number;
    amplificationRatio: string;
  };
};

export type SwapParams = {
  fromMint: string;
  toMint: string;
  fromAmount: number;
  fromDecimals: number;
  toDecimals: number;
  fromSymbol: string;
  toSymbol: string;
};

export type SwapQuoteResult = {
  quoteResponse: DFlowQuoteResponse;
  expectedOutAmount: number;
  priceImpactPct: number;
  transaction: string;
  lastValidBlockHeight: number;
};

export type SwapResult = {
  success: boolean;
  signature?: string;
  fromAmount?: number;
  fromSymbol?: string;
  toAmount?: number;
  toSymbol?: string;
  error?: string;
};

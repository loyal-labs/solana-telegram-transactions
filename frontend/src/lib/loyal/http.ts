import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

import { IRYS_GATEWAY_BASE_URL } from "./constants";

export const irysHttpClient = axios.create({
  baseURL: IRYS_GATEWAY_BASE_URL,
});

export async function fetchIrysTransactionData<T = ArrayBuffer>(
  transactionId: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  if (!transactionId) {
    throw new Error("Transaction ID is required to fetch data.");
  }

  return irysHttpClient.get<T>(`/mutable/${transactionId}`, {
    responseType: "arraybuffer",
    ...config,
  });
}

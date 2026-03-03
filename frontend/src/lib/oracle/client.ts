import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

import { LOYAL_ORACLE_BASE_URL } from "../loyal/constants";
import { normalizeBaseUrl, normalizePath } from "./helpers";

export const loyalHttpClient = axios.create({
  baseURL: normalizeBaseUrl(LOYAL_ORACLE_BASE_URL),
});

export async function getFromOracle<T = unknown>(
  path: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const normalizedPath = normalizePath(path);

  return loyalHttpClient.get<T>(normalizedPath, config);
}

export async function postToOracle<T = unknown, D = unknown>(
  path: string,
  data: D,
  config?: AxiosRequestConfig<D>
): Promise<AxiosResponse<T>> {
  const normalizedPath = normalizePath(path);

  return loyalHttpClient.post<T>(normalizedPath, data, config);
}

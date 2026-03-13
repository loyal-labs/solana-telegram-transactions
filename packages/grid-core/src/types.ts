import type {
  GridEnvironment,
} from "@sqds/grid";

export type GridServerRuntimeConfig = {
  environment: GridEnvironment;
  baseUrl?: string;
  apiKey?: string;
};

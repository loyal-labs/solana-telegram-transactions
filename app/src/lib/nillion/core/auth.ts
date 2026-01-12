import { NilauthClient } from "@nillion/nuc";

import { NILAUTH_URL } from "./constants";

let nilauthClient: NilauthClient | null = null;

export const getNilauthClient = async (): Promise<NilauthClient> => {
  if (!nilauthClient) {
    nilauthClient = await NilauthClient.create({
      baseUrl: NILAUTH_URL,
      payer: undefined,
    });
  }
  return nilauthClient;
};

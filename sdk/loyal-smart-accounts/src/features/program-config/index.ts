import { ProgramConfig } from "@loyal-labs/loyal-smart-accounts-core";
import { createAccountFetcher, createFeatureModule } from "../../feature-factory.js";
import { getRuntimeOperationsForFeature } from "../../operation-registry.js";

export const programConfig = createFeatureModule({
  feature: "programConfig",
  accounts: {
    ProgramConfig,
  },
  operations: getRuntimeOperationsForFeature("programConfig"),
  queries: {
    fetchProgramConfig: createAccountFetcher(ProgramConfig),
  },
});

export const createProgramConfigClient = programConfig.client;

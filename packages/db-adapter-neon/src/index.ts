import { neon } from "@neondatabase/serverless";
import type { DbSchemaModule } from "@loyal-labs/db-core/types";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";

export type NeonDb<TSchema extends DbSchemaModule> = NeonHttpDatabase<TSchema>;

export type CreateNeonDbParams<TSchema extends DbSchemaModule> = {
  databaseUrl: string;
  schema: TSchema;
};

export const createNeonDb = <TSchema extends DbSchemaModule>({
  databaseUrl,
  schema,
}: CreateNeonDbParams<TSchema>): NeonDb<TSchema> => {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
};

import type { ExtractTablesWithRelations } from "drizzle-orm";

import * as schema from "./schema";

export type DbSchemaModule = typeof schema;
export type DbSchemaTables = ExtractTablesWithRelations<DbSchemaModule>;

export type DbFactory<TDatabase> = () => TDatabase;

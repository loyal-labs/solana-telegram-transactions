import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as generatedSchema from "./generated/schema";
import * as generatedRelations from "./generated/relations";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema: { ...generatedSchema, ...generatedRelations } });

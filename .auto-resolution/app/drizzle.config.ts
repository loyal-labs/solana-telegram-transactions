import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/core/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

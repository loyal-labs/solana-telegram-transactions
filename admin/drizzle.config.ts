import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL. Set it in your environment before running `bun run db:schema:pull`."
  );
}

export default defineConfig({
  dialect: "postgresql",
  out: "./src/lib/generated",
  dbCredentials: {
    url: databaseUrl,
  },
});

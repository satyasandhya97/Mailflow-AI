import "dotenv/config";
import { type Config } from "drizzle-kit";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for Drizzle Kit");
}

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  out: "./drizzle",
} satisfies Config;

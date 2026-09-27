import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const isServerless =
  process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// Vercel/serverless: use the transaction pooler (DATABASE_URL, port 6543) with a
// single connection per invocation. Long-running Node (local `next start`): prefer
// the session pooler (DIRECT_URL, port 5432) for stable Corsair tenant setup.
const connectionString = isServerless
  ? env.DATABASE_URL
  : (env.DIRECT_URL ?? env.DATABASE_URL);

export const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    // Required when using PgBouncer / Supabase pooler.
    prepare: false,
    max: isServerless ? 1 : 10,
    idle_timeout: isServerless ? 0 : 20,
    connect_timeout: 15,
  });
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });

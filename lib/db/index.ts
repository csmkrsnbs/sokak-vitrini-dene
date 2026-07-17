import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

export class MissingDatabaseConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL tanımlı değil.");
    this.name = "MissingDatabaseConfigurationError";
  }
}

export function getDb() {
  if (cachedDb) return cachedDb;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new MissingDatabaseConfigurationError();
  }

  const sql = neon(connectionString);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}

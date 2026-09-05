import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.Neon_URL ||
  process.env.NEON_URL;

if (!connectionString) {
  console.warn("Database connection string is missing (DATABASE_URL / Neon_URL)");
}

const sql = neon(connectionString || "");

export const db = drizzle(sql, { schema });

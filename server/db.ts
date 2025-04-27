import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the primary database URL for this session
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "Database URL environment variable is missing. Please add it in the Deployments > Secrets section.",
  );
}

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Function to create a new database connection pool
export function createDbConnection() {
  // Check for the holy-bonus database URL first, then fall back to the standard database URL
  const databaseUrl = process.env.DATABASE_URL_HOLY_BONUS || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const newPool = new Pool({ connectionString: databaseUrl });
  const newDb = drizzle(newPool, { schema });
  
  return { pool: newPool, db: newDb };
}

// Initialize the database connection
const { pool, db } = createDbConnection();

// Export the pool and db instances
export { pool, db };
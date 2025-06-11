import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Add connection event handlers for monitoring
pool.on('connect', (client) => {
  console.log(`Database connected successfully. Pool: ${pool.totalCount} total, ${pool.idleCount} idle`);
});

pool.on('error', (err, client) => {
  console.error('Database connection error:', err);
  console.error('Error details:', {
    message: err.message,
    code: err.code,
    severity: err.severity
  });
});

pool.on('remove', (client) => {
  console.log(`Database connection removed from pool. Pool: ${pool.totalCount} total, ${pool.idleCount} idle`);
});

pool.on('acquire', (client) => {
  console.log(`Database client acquired. Pool: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
});

pool.on('release', (err, client) => {
  if (err) {
    console.error('Error releasing database client:', err);
  }
  console.log(`Database client released. Pool: ${pool.totalCount} total, ${pool.idleCount} idle`);
});

export const db = drizzle({ client: pool, schema });

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('Database pool initialized successfully');
    client.release();
  })
  .catch(err => {
    console.error('Failed to initialize database pool:', err);
  });
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: any;

if (process.env.NODE_ENV === 'production' && process.env.NEON_DATABASE_URL) {
  // Use Neon in production
  const sql = neon(process.env.NEON_DATABASE_URL);
  db = drizzleNeon(sql, { schema });
} else {
  // Use local PostgreSQL in development
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/taskmanagement';
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
}

export { db };
export * from './schema';
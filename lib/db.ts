import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set. Use Supabase Transaction Pooler (port 6543).');
  }
  // prepare: false is required for Supabase Transaction mode pooler (port 6543)
  return drizzle(postgres(url, { prepare: false }), { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  return (_db ??= createDb());
}

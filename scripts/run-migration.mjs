/**
 * Run a SQL migration against the Supabase Postgres directly.
 *
 * Usage: PG_URL="postgres://..." node scripts/run-migration.mjs [path/to.sql]
 *
 * Uses a direct (non-pooling) connection so multi-statement DDL runs in one
 * shot. The migration files are written idempotently (create ... if not
 * exists / drop trigger if exists), so re-running is safe.
 */
import { readFileSync } from "node:fs"
import pg from "pg"

const url = process.env.PG_URL
if (!url) {
  console.error("Set PG_URL to the Postgres connection string.")
  process.exit(1)
}
const file = process.argv[2] || "supabase/migrations/20260621000000_tracker_and_auth.sql"
const sql = readFileSync(file, "utf8")

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log("✓ migration applied:", file)
} finally {
  await client.end()
}

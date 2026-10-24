/**
 * Shared loader for the root-level scripts.
 * Resolves `pg` and `dotenv` from tally-backend/node_modules without
 * installing anything new and without modifying the backend folder.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const backendPkg = fileURLToPath(new URL("../tally-backend/package.json", import.meta.url));
const backendRequire = createRequire(backendPkg);

export const dotenv = backendRequire("dotenv");
export const pg = backendRequire("pg");

export const BACKEND_DIR = fileURLToPath(new URL("../tally-backend/", import.meta.url));
export const ERD_FILE = fileURLToPath(new URL("../erd/tallyconnect_erd.sql", import.meta.url));
export const ENV_FILE = fileURLToPath(new URL("../tally-backend/.env", import.meta.url));

export function loadEnv() {
  dotenv.config({ path: ENV_FILE });
}

export function makePool() {
  loadEnv();
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
}

/** Credentials with password masked, safe for logs. */
export function maskUrl(url) {
  return String(url).replace(/:[^:@/]+@/, ":***@");
}

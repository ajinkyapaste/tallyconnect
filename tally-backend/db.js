/*
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",        
  password: "root",
  database: "Tally12",
});

export default pool;

*/
/*

import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;

*/
import "dotenv/config.js";
import pkg from "pg";

const { Pool } = pkg;

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:crm%40123@localhost:5433/Tally12";
const isLocalhost = dbUrl.includes("localhost");
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false
  }
});

/* A dropped *idle* client (e.g. Render recycling a Postgres connection) emits
   an 'error' event on the pool. With no listener that event is unhandled and
   takes the whole API process down — which is exactly the crash we saw:
   "Connection terminated unexpectedly" / ECONNRESET. Swallow it: pg removes
   the dead client from the pool and the next query opens a fresh one. */
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err?.message || err);
});

export default pool;
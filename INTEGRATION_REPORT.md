# TallyConnect — End-to-End Integration Report

**Date:** 2026-10-08
**Flow verified:** Frontend → API → Backend → Render PostgreSQL → Backend → Frontend
**Final navigation flow:** Login → Dashboard → Ledger List → Inventory → Delete History → Orders → Voucher Explore → Settings → Logout

---

## 1. Database (ERD → Render PostgreSQL)

| Item | Result |
|---|---|
| ERD extracted from `erd/*.docx` → `erd/tallyconnect_erd.sql` | 50 tables, 30 FKs (source of truth) |
| Schema created in Render DB via `scripts/setup-db.mjs` | ✅ 90/90 statements, 0 failures |
| Destructive-statement guard (DROP/TRUNCATE/DELETE) | ✅ hard-blocked |
| Verification via `scripts/verify-erd.mjs` | ✅ **FULL MATCH** — 50/50 tables, 48/48 PKs, 30/30 FKs, 88 indexes |

- 87 indexes come from the ERD; 1 extra (`idx_mobile_notifications_user`) was created by the
  backend's **own** startup self-heal (`CREATE INDEX IF NOT EXISTS`) — additive, expected, no ERD deviation.
- Re-verified after all testing: still full match.
- **No table was ever dropped, truncated, reset, or had its structure altered.**

## 2. Backend connection (no backend code changed)

- **Only file added to `tally-backend/`:** `.env` (Render `DATABASE_URL`). `server.js`, routes,
  middleware, `package.json` — untouched.
- Helper + test scripts live **outside** the backend in root `scripts/` (they reuse the backend's
  `pg` via `createRequire`; no new installs).
- **Quirk (not fixed, per instructions):** `db.js` reads `process.env.DATABASE_URL` at *import time*,
  but `dotenv.config()` runs *after* imports in `server.js`; `npm start` falls back to `localhost:5433`.
  **Workaround:** start with `node --env-file=.env server.js`.
- **CORS:** verified preflight `204`, `authorization` allowed.

## 3. Demo data (rows only — structure never touched, nothing deleted)

`scripts/seed-demo-data.mjs` (idempotent, guarded inserts):

- demo user (`demo-ui@test.local`), 1 company + active/selected company
- 10 ledgers, 3 stock items (+summary/movements), 5 bills, 5 vouchers (+entries)
- 1 archived ledger placed in **Delete History** (`LED-ARCHIVE`, restorable) + pre-granted permission
- **4 orders** (+3 order line items) and `order_selection_permissions.allowed_orders`
- full USER permission rows (`user_ledger_permissions`, `user_inventory_permissions`,
  `voucher_selection_permissions`, `order_selection_permissions`)

## 4. The 7 tabs → live APIs

| Tab | Backend endpoint(s) | Functionality wired |
|---|---|---|
| **Dashboard** | `GET /dashboard/summary`, `GET /ledger`, `GET /voucher-entry` | real receivable/payable/cash cards, 6 quick-action cards → the other tabs, live recent activity |
| **Ledger List** | `GET /ledger` | live table (name/type/group/opening/closing), search, pagination |
| **Inventory** | `GET /inventory`, `POST /stock-summary/sync` (+ best-effort `POST /stock-item/sync`, `POST /inventory/user-inventory`) | live table + stock badges, search, low/out-of-stock filter, **Add Item** |
| **Delete History** | `GET /ledger/deleted/history`, `POST /ledger/deleted/restore/:id` | live table from `deleted_records`, search, **Restore** |
| **Orders** | `GET /orders` | live order book (customer/amount/status/line items), search, pagination |
| **Voucher Explore** | `GET /voucher-entry/paged`, `GET /voucher-entry/:uuid` | search + type/year/sort filters, pagination, click-through to voucher detail (ledger entries) |
| **Settings** | `GET/PUT /users/me`, `GET /users/me/notifications`, `GET /api/mobile/notifications` | persisted theme/color/background/opacity, working Dark Mode & Auto Sync switches, language; Logout |

Header is fully wired: live username/initial, **Log Out** (nav + user chip), notifications bell
(real unread dot), global search (filters the current tab / jumps to Voucher Explore), Quick Add.

## 5. Login & auth

- Login background **image removed** (`body.auth-mode`); the rest of the login UI is unchanged.
- Auth flow: `POST /auth/login` → JWT in `localStorage`; every request sends `Authorization: Bearer`.
- **Protected routes:** no session → login screen; any `401` clears the session and returns to login;
  **Logout** clears the token/user and returns to login.
- No DB credentials anywhere in frontend code (API base URL only, from `VITE_API_URL`).

## 6. API test results — **28/28 passed** (`scripts/test-tabs.mjs`)

- **Auth guard:** no-token → 401; login → token; `GET /auth/me`; active company.
- **Ledger List:** `/ledger` returns rows with balances.
- **Inventory:** `/inventory` returns rows; Add Item persists via `/stock-summary/sync`
  (verified directly in `stock_summary`).
- **Delete History:** `/ledger/deleted/history` lists the demo record; `restore/:id` re-creates the
  ledger and removes the history row (verified in DB).
- **Orders:** `/orders` returns 4 orders incl. line items.
- **Voucher Explore:** `/voucher-entry/paged` returns data + `meta.total`/types; search filter works;
  `/:guid` returns `ledger_entries`.
- **Settings:** `/users/me`, `/users/me/notifications`, `/api/mobile/notifications` all 200.
- **Dashboard:** `/dashboard/summary` 200.

`scripts/test-api.mjs` (the original 23 end-to-end tests) also still passes.

**Build:** `npm run build` ✅. Vite dev server transforms `App.jsx` + `index.css` cleanly (HTTP 200).

## 7. How to run

```bash
# Backend (env must be preloaded — see quirk above)
cd tally-backend
node --env-file=.env server.js        # http://localhost:4000

# Frontend
cd tally-frontend
npm run dev                            # http://localhost:5173
```

**Demo login:** `demo-ui@test.local` / `Demo@1234` → login type **User**

## 8. Remaining issues / notes

1. **`POST /stock-item/sync` returns 500 (pre-existing backend bug, not fixed):** it uses
   `ON CONFLICT (admin_id, item_guid)`, but the only unique key is the PK
   `(admin_id, company_guid, item_guid)` → Postgres error 42P10. The Inventory **Add Item** flow is
   non-blocking and drives the live list from the working `POST /stock-summary/sync`; the item master
   write is best-effort. Fixing it would require a backend/index change, so it was left untouched.
2. **USER-role ACL (existing backend behaviour):** `GET /inventory` only lists items present in
   `user_inventory_permissions`, and `GET /orders`/`GET /ledger`/`GET /voucher-entry` are similarly
   scoped to per-user grants. The seed grants everything for the demo user; a **newly added** item is
   shown immediately in-session (and is genuinely stored in PostgreSQL) but needs an admin grant to
   persist in the USER's list after reload. The Restore demo ledger is pre-granted so it appears in
   Ledger List after restoring.
3. **Hardcoded JWT secret:** `routes/auth.js:5` overwrites `JWT_SECRET` at module load; `.env` then
   overwrites it again in `server.js`. Net effect: the `.env` secret is used, but remove the hardcoded
   fallback when next touching the backend.
4. **ADMIN login depends on external `dashboard.licentic.org`** (license API). Path works; an ADMIN
   login needs a real licensed email + valid key.
5. **`env/.env.example` contains the plaintext DB password** — do not commit/publish it.
6. **`npm start` won't use the Render DB** (import-order quirk, item above). A `start:env` script
   would fix it, but that is a backend change — left alone.
7. **Browser automation unavailable** in this session (no desktop browser connected), so the UI was
   verified via production build + Vite module transforms + 28 API-level tests, not click-through.
8. Test runs left `VCH-TEST-*` / `LED-E2E-*` / `ITEM-TEST-*` / `LED-TEST-*` rows as test data;
   **nothing existing was ever deleted.**

**Nothing was dropped, truncated or altered in the database structure. No backend code was modified.**

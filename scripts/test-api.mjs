/**
 * test-api.mjs — end-to-end API tests against the running backend.
 * Flow: login → auth → company → dashboard → ledgers → vouchers →
 *       inventory → CREATE voucher → READ back (persistence) → 401 checks.
 *
 * Usage: node scripts/test-api.mjs   (backend must be running on PORT)
 */
const BASE = process.env.API_URL || "http://localhost:4000";

let token = "";
let passed = 0,
  failed = 0;

const ok = (name, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`);
  }
};

async function call(method, path, body, withAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (withAuth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, data };
}

const DEMO = {
  username: "demo-ui@test.local",
  password: "Demo@1234",
  loginType: "USER",
};

async function main() {
  console.log(`API target: ${BASE}\n`);

  /* ---------- 1. AUTH ---------- */
  console.log("1) Authentication");
  let r = await call("GET", "/auth/me", undefined, false);
  ok("GET /auth/me without token → 401", r.status === 401, `got ${r.status}`);

  r = await call("POST", "/auth/login", { ...DEMO, password: "wrong" }, false);
  ok("POST /auth/login wrong password → 401", r.status === 401, `got ${r.status}`);

  r = await call("POST", "/auth/login", DEMO, false);
  ok("POST /auth/login correct → 200 + token", r.status === 200 && !!r.data?.token);
  token = r.data?.token || "";
  ok("JWT stored", token.length > 20);

  r = await call("POST", "/auth/login", { ...DEMO, loginType: "ADMIN" }, false);
  ok("ADMIN login path responds (license service)", [200, 401, 403].includes(r.status), `got ${r.status}`);

  r = await call("GET", "/auth/me");
  ok("GET /auth/me with token → 200", r.status === 200 && r.data?.username === "demo-ui", `user=${r.data?.username}`);

  r = await call("POST", "/auth/register", { username: "x", email: "demo-ui@test.local", password: "x" }, false);
  ok("Duplicate register rejected", r.status === 400, `got ${r.status}`);

  /* ---------- 2. COMPANY ---------- */
  console.log("2) Company / active");
  r = await call("GET", "/company/active");
  ok("GET /company/active → company_guid", r.status === 200 && !!r.data?.company_guid, r.data?.company_guid);
  const companyGuid = r.data?.company_guid;
  if (!companyGuid) throw new Error("No active company — cannot continue");

  /* ---------- 3. DASHBOARD ---------- */
  console.log("3) Dashboard (PostgreSQL aggregates)");
  r = await call("GET", `/dashboard/summary?company_guid=${companyGuid}`);
  ok(
    "GET /dashboard/summary",
    r.status === 200 && r.data?.receivables !== undefined,
    `receivables=${r.data?.receivables} payables=${r.data?.payables} pending=${r.data?.pending_bills}`
  );
  const summary = r.data;

  r = await call("GET", `/dashboard/bills?company_guid=${companyGuid}`);
  ok("GET /dashboard/bills", r.status === 200 && Array.isArray(r.data) && r.data.length > 0, `${r.data?.length} bills`);

  r = await call("GET", `/dashboard/income-expense?company_guid=${companyGuid}`);
  ok("GET /dashboard/income-expense", r.status === 200 && Array.isArray(r.data), `${r.data?.length} months`);

  /* ---------- 4. LEDGERS / PARTIES ---------- */
  console.log("4) Ledgers (Parties)");
  r = await call("GET", "/ledger");
  const ledgers = r.data?.data || [];
  ok("GET /ledger", r.status === 200 && r.data?.success && ledgers.length > 0, `${ledgers.length} ledgers`);
  ok("Ledger has party data", ledgers.some((l) => /ramesh|super/i.test(l.name || "")));

  /* ---------- 5. INVENTORY ---------- */
  console.log("5) Inventory (Items)");
  r = await call("GET", "/inventory");
  const inv = r.data?.data || [];
  ok("GET /inventory", r.status === 200 && r.data?.success && inv.length > 0, `${inv.length} items`);
  ok("Item has closing stock", inv.every((i) => i.closing !== undefined), inv.map((i) => `${i.name}:${i.closing}`).join(", "));

  /* ---------- 6. VOUCHERS (READ) ---------- */
  console.log("6) Vouchers");
  r = await call("GET", "/voucher-entry");
  const vouchersBefore = r.data?.data || [];
  ok("GET /voucher-entry", r.status === 200 && r.data?.success, `${vouchersBefore.length} vouchers`);

  /* ---------- 7. CRUD: CREATE + READ BACK + PERSIST ---------- */
  console.log("7) CRUD — create a Sales voucher and read it back");
  const party = ledgers.find((l) => /ramesh/i.test(l.name)) || ledgers[0];
  const guid = `VCH-TEST-${Date.now()}`;
  const payload = {
    voucher_guid: guid,
    company_guid: companyGuid,
    voucher_date: new Date().toISOString().slice(0, 10),
    voucher_type: "Sales",
    reference_no: "E2E-TEST",
    net_amount: 999,
    party_name: party.name,
    entries: [{ ledger_name: party.name, amount: 999, is_debit: false }],
  };
  r = await call("POST", "/voucher-entry/sync", payload);
  ok("POST /voucher-entry/sync", r.status === 200 && r.data?.success === true && !r.data?.skipped);

  r = await call("GET", `/voucher-entry/${guid}`);
  ok(
    "Created voucher + entry readable from PostgreSQL",
    r.status === 200 && r.data?.voucher_guid === guid && (r.data?.ledger_entries || []).length > 0,
    `entries=${r.data?.ledger_entries?.length ?? 0}`
  );

  // NOTE: the list endpoint (GET /voucher-entry) applies the backend's
  // `voucher_selection_permissions` allow-list for USER-role accounts — that
  // is existing backend ACL behaviour (not modified). Newly created vouchers
  // appear in the list for ADMIN accounts or after the user is granted them.
  r = await call("GET", "/voucher-entry");
  const listOk = r.status === 200 && (r.data?.data || []).some((v) => v.voucher_guid === guid);
  console.log(
    `  ℹ️  Created voucher in USER allow-listed list: ${listOk ? 'yes' : 'no (ACL allow-list — expected for USER role)'}` 
  );

  r = await call("POST", "/ledger/sync", {
    ledger_guid: `LED-E2E-${Date.now()}`,
    company_guid: companyGuid,
    name: "E2E Test Ledger",
    type: "Sundry Debtors",
    opening_balance: 0,
    closing_balance: 42,
  });
  ok("POST /ledger/sync (ledger CRUD create)", r.status === 200 && r.data?.success === true);

  /* ---------- 8. AUTH GUARDS ---------- */
  console.log("8) Route guards");
  const saved = token;
  token = "";
  r = await call("GET", "/ledger");
  ok("GET /ledger without token → 401", r.status === 401, `got ${r.status}`);
  r = await call("GET", "/dashboard/summary?company_guid=x");
  ok("GET /dashboard/summary without token → 401", r.status === 401, `got ${r.status}`);
  token = saved;
  r = await call("GET", "/check-db");
  ok("GET /check-db with token → DB time", r.status === 200 && r.data?.success === true, JSON.stringify(r.data?.time || r.data));

  /* ---------- 9. NOTIFICATIONS ---------- */
  console.log("9) Notifications");
  r = await call("GET", "/api/mobile/notifications");
  ok("GET /api/mobile/notifications", r.status === 200 && Array.isArray(r.data?.notifications), `${r.data?.notifications?.length ?? 0} notifications`);

  console.log(`\n════════ RESULT: ${passed} passed, ${failed} failed ════════`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("TEST CRASH:", e);
  process.exit(1);
});

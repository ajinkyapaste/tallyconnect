/**
 * seed-demo-data.mjs
 * ------------------
 * Inserts DEMO ROWS (never structure changes, never deletes/truncates) so the
 * connected frontend has real data to display:
 *   - links the demo user as its own admin + grants its permission rows
 *   - one company (+ selected/active company)
 *   - ledgers (parties, cash & bank)
 *   - stock items + stock summary + movements
 *   - bills (receivable / payable / one cleared)
 *   - vouchers + voucher entries (recent activity, income/expense)
 *
 * Every statement is idempotent (ON CONFLICT DO NOTHING / WHERE NOT EXISTS).
 * Safe to run repeatedly. All rows are keyed to the demo admin only.
 *
 * Usage: node scripts/seed-demo-data.mjs
 */
import { makePool, maskUrl, loadEnv } from "./_shared.mjs";

loadEnv();
const pool = makePool();

const DEMO_EMAIL = "demo-ui@test.local";
const DEMO_USER = "demo-ui";
const DEMO_PASS = "Demo@1234";
const COMPANY_GUID = "DEMO-COMPANY-001";
const COMPANY_NAME = "TallyConnect Demo Co";

const d = (offsetDays) => {
  const t = new Date();
  t.setDate(t.getDate() + offsetDays);
  return t.toISOString().slice(0, 10);
};

async function upsert(table, conflictCols, row) {
  const cols = Object.keys(row);
  const vals = Object.values(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
  const updates = cols
    .filter((c) => !conflictCols.includes(c))
    .map((c) => `${c} = EXCLUDED.${c}`);
  const onConflict = updates.length
    ? `ON CONFLICT (${conflictCols.join(", ")}) DO UPDATE SET ${updates.join(", ")}`
    : `ON CONFLICT (${conflictCols.join(", ")}) DO NOTHING`;
  await pool.query(
    `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders}) ${onConflict}`,
    vals
  );
}

async function main() {
  console.log("Seeding demo data into:", maskUrl(process.env.DATABASE_URL));

  /* ---------- 1. Demo user: link as its own admin ---------- */
  await pool.query(
    `INSERT INTO users (username, email, password, role)
     VALUES ($1, $2, $3, 'USER')
     ON CONFLICT (email) DO NOTHING`,
    [DEMO_USER, DEMO_EMAIL, DEMO_PASS]
  );
  const u = await pool.query(`SELECT id, admin_id FROM users WHERE email = $1`, [DEMO_EMAIL]);
  const userId = u.rows[0].id;
  if (!u.rows[0].admin_id) {
    await pool.query(`UPDATE users SET admin_id = id WHERE id = $1`, [userId]);
  }
  const adminId = userId;
  console.log(`  user id=${userId} admin_id=${adminId}`);

  /* ---------- 2. Company + selected + active ---------- */
  await upsert("companies", ["admin_id", "company_guid"], {
    admin_id: adminId,
    company_guid: COMPANY_GUID,
    name: COMPANY_NAME,
    is_authenticated: true,
  });
  await pool.query(
    `INSERT INTO selected_companies (admin_id, company_guid)
     VALUES ($1, $2) ON CONFLICT (admin_id, company_guid) DO NOTHING`,
    [adminId, COMPANY_GUID]
  );
  await pool.query(
    `INSERT INTO active_company (admin_id, company_guid)
     VALUES ($1, $2) ON CONFLICT (admin_id) DO NOTHING`,
    [adminId, COMPANY_GUID]
  );

  /* ---------- 3. Ledgers (parties / cash / bank) ---------- */
  const ledgers = [
    // name,               type,               parent_group,        closing, guid
    ["Ramesh Traders", "Sundry Debtors", "Sundry Debtors", 12500, "LED-RAMESH"],
    ["Neha Sharma", "Sundry Debtors", "Sundry Debtors", 5000, "LED-NEHA"],
    ["City Distributors", "Sundry Debtors", "Sundry Debtors", 12500, "LED-CITY"],
    ["Super Wholesalers", "Sundry Creditors", "Sundry Creditors", 45000, "LED-SUPER"],
    ["Cash", "Cash-in-Hand", "Cash-in-Hand", 450000, "LED-CASH"],
    ["HDFC Bank", "Bank Accounts", "Bank Accounts", 1000000, "LED-HDFC"],
    ["Sales A/c", "Sales Accounts", "Sales Accounts", 0, "LED-SALESA"],
    ["Purchase A/c", "Purchase Accounts", "Purchase Accounts", 0, "LED-PURCHA"],
  ];
  for (const [name, type, parent, closing, guid] of ledgers) {
    await upsert("ledgers", ["admin_id", "company_guid", "ledger_guid"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      ledger_guid: guid,
      name,
      type,
      parent_group: parent,
      opening_balance: 0,
      closing_balance: closing,
      company_name: COMPANY_NAME,
    });
  }

  /* ---------- 4. Stock items + summary + movements ---------- */
  const items = [
    // name,             group,        unit, opening, closing, value,   rate,   guid
    ["Premium Notebook", "Stationery", "Pcs", 120, 120, 6000, 50, "ITEM-NOTEBOOK"],
    ["Blue Ink Pen", "Stationery", "Pcs", 5, 5, 50, 10, "ITEM-PEN"],
    ["Office Chair", "Furniture", "Pcs", 25, 25, 112500, 4500, "ITEM-CHAIR"],
  ];
  for (const [name, group, unit, opening, closing, value, rate, guid] of items) {
    await upsert("stock_items", ["admin_id", "company_guid", "item_guid"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      item_guid: guid,
      name,
      parent_group: group,
      unit,
      opening_qty: opening,
      opening_value: value,
    });
    await upsert("stock_summary", ["admin_id", "company_guid", "item_name"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      item_name: name,
      closing_qty: closing,
      closing_value: value,
    });
    await pool.query(
      `INSERT INTO inventory_movements (admin_id, company_guid, item_name, qty, movement_type, voucher_type, voucher_date)
       SELECT $1, $2, $3, $4, 'IN', 'Purchase', $5
       WHERE NOT EXISTS (
         SELECT 1 FROM inventory_movements
         WHERE admin_id = $1 AND company_guid = $2 AND item_name = $3
       )`,
      [adminId, COMPANY_GUID, name, opening, d(-30)]
    );
  }

  /* ---------- 5. Bills (dashboard summary + outstanding) ---------- */
  const bills = [
    // ledger,    ledgerGuid,   bill_name, bill_type,     amount, pending, bill_date, due_date, guid
    ["Ramesh Traders", "LED-RAMESH", "INV-1042", "RECEIVABLE", 200000, 200000, -20, -10, "BILL-1042"],
    ["City Distributors", "LED-CITY", "INV-1055", "RECEIVABLE", 12500, 12500, -12, 2, "BILL-1055"],
    ["Neha Sharma", "LED-NEHA", "INV-1061", "RECEIVABLE", 307500, 307500, -3, 7, "BILL-1061"],
    ["Ramesh Traders", "LED-RAMESH", "INV-1030", "RECEIVABLE", 50000, 0, -40, -25, "BILL-1030"],
    ["Super Wholesalers", "LED-SUPER", "PUR-2042", "PAYABLE", 380000, 380000, -15, -5, "BILL-2042"],
  ];
  for (const [ledger, lguid, billName, billType, amount, pending, bd, dd, guid] of bills) {
    await upsert("bills", ["admin_id", "company_guid", "ledger_name", "bill_name"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      bill_guid: guid,
      ledger_guid: lguid,
      ledger_name: ledger,
      bill_name: billName,
      bill_type: billType,
      amount,
      pending_amount: pending,
      bill_date: d(bd),
      due_date: d(dd),
      status: pending > 0 ? "Pending" : "Cleared",
    });
  }

  /* ---------- 6. Vouchers + entries (recent activity) ---------- */
  const vouchers = [
    // guid, type, party, amount, dateOffset, entry ledger, is_debit
    ["VCH-SALES-001", "Sales", "Ramesh Traders", 12500, 0, "Ramesh Traders", false],
    ["VCH-RCPT-001", "Receipt", "Neha Sharma", 5000, -1, "Neha Sharma", true],
    ["VCH-SALES-002", "Sales", "City Distributors", 18000, -3, "City Distributors", false],
  ];
  for (const [guid, type, party, amount, off, entryLedger, isDebit] of vouchers) {
    await upsert("vouchers", ["admin_id", "company_guid", "voucher_guid"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      voucher_guid: guid,
      voucher_type: type,
      voucher_date: d(off),
      net_amount: amount,
      party_name: party,
      company_name: COMPANY_NAME,
      is_active: true,
    });
    await upsert("voucher_entries", ["admin_id", "company_guid", "voucher_guid", "ledger_name"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      voucher_guid: guid,
      ledger_name: entryLedger,
      amount,
      is_debit: isDebit,
      voucher_date: d(off),
      voucher_type: type,
      is_active: true,
    });
    // counter-entry so books balance
    const counter = type === "Sales" || type === "Receipt" ? "Cash" : "Cash";
    await upsert("voucher_entries", ["admin_id", "company_guid", "voucher_guid", "ledger_name"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      voucher_guid: guid,
      ledger_name: counter,
      amount,
      is_debit: !isDebit,
      voucher_date: d(off),
      voucher_type: type,
      is_active: true,
    });
  }

  /* ---------- 6b. Orders (+ line items) ---------- */
  const orders = [
    // guid, order_no, type, party, amount, dateOffset, dueOffset, status
    ["ORD-1001", "SO-1001", "Sales Order", "Ramesh Traders", 12500, -2, 5, "Pending"],
    ["ORD-1002", "PO-2001", "Purchase Order", "Super Wholesalers", 38000, -5, -1, "Approved"],
    ["ORD-1003", "SO-1002", "Sales Order", "City Distributors", 9000, 0, 10, "Pending"],
    ["ORD-1004", "PO-2002", "Purchase Order", "Super Wholesalers", 15000, -8, -3, "Completed"],
  ];
  for (const [guid, no, type, party, amount, od, dd, status] of orders) {
    await upsert("orders", ["order_guid"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      order_guid: guid,
      order_no: no,
      order_type: type,
      party_name: party,
      amount,
      order_date: d(od),
      due_date: d(dd),
      status,
      is_active: true,
    });
  }
  const orderItems = [
    ["ORD-1001", "Premium Notebook", 100, 50, 5000],
    ["ORD-1001", "Blue Ink Pen", 200, 10, 2000],
    ["ORD-1003", "Office Chair", 1, 4500, 4500],
  ];
  for (const [guid, item, qty, rate, amount] of orderItems) {
    await upsert("ledger_items", ["admin_id", "company_guid", "voucher_guid", "item_name"], {
      admin_id: adminId,
      company_guid: COMPANY_GUID,
      voucher_guid: guid,
      voucher_type: "Order",
      ledger_name: "Orders",
      item_name: item,
      quantity: qty,
      rate,
      amount,
    });
  }

  /* ---------- 7. Permission rows for the demo USER ---------- */
  const ledgerRows = await pool.query(
    `SELECT ledger_guid, name FROM ledgers WHERE admin_id = $1`,
    [adminId]
  );
  for (const l of ledgerRows.rows) {
    await pool.query(
      `INSERT INTO user_ledger_permissions (user_id, ledger_guid, ledger_name)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM user_ledger_permissions
         WHERE user_id = $1 AND ledger_guid = $2
       )`,
      [userId, l.ledger_guid, l.name]
    );
  }
  for (const [name] of items) {
    await pool.query(
      `INSERT INTO user_inventory_permissions (user_id, item_name, admin_id, columns)
       VALUES ($1, $2, $3, '{}'::jsonb)
       ON CONFLICT (admin_id, user_id, item_name) DO NOTHING`,
      [userId, name, adminId]
    );
  }

  /* ---------- 7b. Demo "Delete History" record (restorable ledger) ---------- */
  const ARCHIVE_GUID = "LED-ARCHIVE";
  const ARCHIVE_NAME = "Archived Traders (Demo)";
  const archiveExists = await pool.query(
    `SELECT 1 FROM ledgers WHERE admin_id = $1 AND company_guid = $2 AND ledger_guid = $3`,
    [adminId, COMPANY_GUID, ARCHIVE_GUID]
  );
  if (archiveExists.rowCount === 0) {
    await pool.query(
      `INSERT INTO deleted_records
         (admin_id, company_guid, entity_type, entity_guid, entity_data, deleted_from)
       SELECT $1, $2, 'ledger', $3, $4::jsonb, 'tally_sync'
       WHERE NOT EXISTS (
         SELECT 1 FROM deleted_records
         WHERE admin_id = $1 AND entity_type = 'ledger' AND entity_guid = $3
       )`,
      [
        adminId,
        COMPANY_GUID,
        ARCHIVE_GUID,
        JSON.stringify({
          ledger_guid: ARCHIVE_GUID,
          company_guid: COMPANY_GUID,
          name: ARCHIVE_NAME,
          parent_group: "Sundry Debtors",
          type: "Sundry Debtors",
          opening_balance: 0,
          closing_balance: 2500,
          email: null,
          phone: null,
        }),
      ]
    );
    // Pre-grant so this ledger is visible to the demo USER once restored.
    await pool.query(
      `INSERT INTO user_ledger_permissions (user_id, ledger_guid, ledger_name)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM user_ledger_permissions WHERE user_id = $1 AND ledger_guid = $2
       )`,
      [userId, ARCHIVE_GUID, ARCHIVE_NAME]
    );
  }

  /* ---------- 8. JSON permissions on the user row ---------- */
  await pool.query(
    `UPDATE users
     SET inventory_permissions = COALESCE(inventory_permissions, '{"can_view": true, "columns": {}}'::jsonb),
         voucher_selection_permissions = jsonb_build_object(
           'allowed_vouchers',
           COALESCE((
             SELECT jsonb_agg(voucher_guid) FROM vouchers
             WHERE admin_id = $2 AND company_guid = $3
           ), '[]'::jsonb)
         ),
         order_selection_permissions = jsonb_build_object(
           'allowed_orders',
           COALESCE((
             SELECT jsonb_agg(order_guid) FROM orders
             WHERE admin_id = $2 AND company_guid = $3
           ), '[]'::jsonb)
         ),
         dashboard_permissions = COALESCE(dashboard_permissions, '{}'::jsonb)
     WHERE id = $1`,
    [userId, adminId, COMPANY_GUID]
  );

  /* ---------- Summary ---------- */
  const tables = [
    "users", "companies", "active_company", "selected_companies", "ledgers",
    "stock_items", "stock_summary", "inventory_movements", "bills",
    "vouchers", "voucher_entries", "user_ledger_permissions", "user_inventory_permissions",
    "orders", "ledger_items", "deleted_records",
  ];
  console.log("\nRow counts:");
  for (const t of tables) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
    console.log(`  ${t}: ${rows[0].c}`);
  }
  console.log(`\n✅ Demo data ready. Login → email=${DEMO_EMAIL} password=${DEMO_PASS} (loginType USER)`);
  await pool.end();
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});

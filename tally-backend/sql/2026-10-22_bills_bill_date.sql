/* =========================================================
   BILL DATE — the bill's own date as Tally's reports send it, so the
   app can show Bill date and Credit period.
========================================================= */
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS bill_date DATE;

CREATE INDEX IF NOT EXISTS bills_company_bill_date_idx
  ON bills (admin_id, company_guid, bill_date);

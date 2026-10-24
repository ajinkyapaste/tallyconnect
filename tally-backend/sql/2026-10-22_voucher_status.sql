/* =========================================================
   VOUCHER STATUS — cancelled / optional vouchers and the built-in
   voucher type, so Tally's books can be reproduced. NULL = not known
   (an older Agent) = counted as before.
========================================================= */
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_optional  BOOLEAN,
  ADD COLUMN IF NOT EXISTS base_type    TEXT,
  ADD COLUMN IF NOT EXISTS is_accounting BOOLEAN;

ALTER TABLE voucher_entries
  ADD COLUMN IF NOT EXISTS is_accounting BOOLEAN;

CREATE INDEX IF NOT EXISTS vouchers_accounting_idx
  ON vouchers (admin_id, company_guid, is_accounting);

CREATE INDEX IF NOT EXISTS voucher_entries_accounting_idx
  ON voucher_entries (admin_id, company_guid, is_accounting);

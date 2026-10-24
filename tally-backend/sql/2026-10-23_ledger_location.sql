/* =========================================================
   LEDGER LOCATION — state, PIN code, country and address of a ledger, as
   saved in Tally (LEDSTATENAME, PINCODE, COUNTRYNAME, ADDRESS.LIST).
   Only adds the four columns; existing ledgers keep NULL (unknown).
========================================================= */
ALTER TABLE ledgers
  ADD COLUMN IF NOT EXISTS state   VARCHAR(80),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(12),
  ADD COLUMN IF NOT EXISTS country VARCHAR(60),
  ADD COLUMN IF NOT EXISTS address VARCHAR(500);

CREATE INDEX IF NOT EXISTS ledgers_location_idx
  ON ledgers (admin_id, company_guid, state);

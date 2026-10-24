/* =========================================================
   E-INVOICE (Basic) — what the Agent saw in TallyPrime for each
   sales / purchase invoice: IRN, acknowledgement, signed QR and the
   e-way bill. Tally creates the e-invoice; this table only tracks it.
========================================================= */
CREATE TABLE IF NOT EXISTS einvoices (
  id                BIGSERIAL PRIMARY KEY,
  admin_id          INTEGER NOT NULL,
  company_guid      TEXT    NOT NULL,
  voucher_guid      TEXT    NOT NULL,
  voucher_date      DATE    NOT NULL,
  voucher_type      TEXT,
  voucher_no        TEXT,
  party_name        TEXT,
  party_gstin       TEXT,
  registration_type TEXT,
  company_gstin     TEXT,
  place_of_supply   TEXT,
  amount            NUMERIC(18, 2),
  is_sale           BOOLEAN NOT NULL DEFAULT FALSE,
  is_optional       BOOLEAN NOT NULL DEFAULT FALSE,
  is_cancelled      BOOLEAN NOT NULL DEFAULT FALSE,
  gst_applicable    BOOLEAN,
  irn               TEXT,
  ack_no            TEXT,
  ack_date          DATE,
  signed_qr         TEXT,
  irn_cancelled     BOOLEAN NOT NULL DEFAULT FALSE,
  eway_applicable   BOOLEAN,
  eway              JSONB,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id, company_guid, voucher_guid)
);

CREATE INDEX IF NOT EXISTS einvoices_company_date_idx
  ON einvoices (admin_id, company_guid, voucher_date DESC);

CREATE INDEX IF NOT EXISTS einvoices_pending_idx
  ON einvoices (admin_id, company_guid, irn, irn_cancelled);

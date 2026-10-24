/*
 * insertVoucherEdit.js
 *
 * Helper that mirrors the INSERT logic used in `finishMobileEdit` for creating a new
 * ALTER entry in `mobile_sync_queue`.
 */

/**
 * Insert a voucher edit (ALTER) command into `mobile_sync_queue`.
 *
 * @param {object} db - Database client supporting `query`.
 * @param {object} params - Parameters matching the SQL placeholders.
 *   adminId, company_guid, target (voucher GUID), payload (JSON), payload_hash,
 *   editOf (optional), created_by (user id).
 */
export async function insertVoucherEdit(db, {
  adminId,
  company_guid,
  target,
  payload,
  payload_hash,
  editOf = null,
  created_by,
}) {
  const query = `INSERT INTO mobile_sync_queue
        (admin_id, company_guid, entity_type, entity_guid, action, payload, payload_hash, source, status,
         target_guid, edit_of, created_by, updated_at)
        VALUES ($1, $2, 'VOUCHER', $3, 'ALTER', $4, $5, 'MOBILE', 'pending', $3::text, $6, $7, NOW())
        RETURNING id`;

  const values = [adminId, company_guid, target, payload, payload_hash, editOf, created_by];
  const result = await db.query(query, values);
  return result.rows[0];
}

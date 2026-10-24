const pool = require('../tally-backend/db.js').default || require('../tally-backend/db.js');

(async () => {
  try {
    const admins = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const a of admins.rows) {
      // 1. Enable leave_settings
      await pool.query(`
        INSERT INTO leave_settings (admin_id, enabled, year_start_month, weekly_off, half_day, backdate_days, max_request_days, updated_at)
        VALUES ($1, true, 4, '{0}', true, 7, 30, NOW())
        ON CONFLICT (admin_id) DO UPDATE SET enabled = true
      `, [a.id]);
      console.log('Enabled leave_settings for admin_id:', a.id);

      // 2. Ensure default leave types exist
      const existingTypes = await pool.query('SELECT id FROM leave_types WHERE admin_id = $1', [a.id]);
      if (existingTypes.rows.length === 0) {
        await pool.query(`
          INSERT INTO leave_types (admin_id, name, yearly_quota, paid, carry_forward, max_carry, active) VALUES
          ($1, 'Casual Leave', 12, true, false, null, true),
          ($1, 'Sick Leave', 6, true, false, null, true),
          ($1, 'Unpaid Leave', null, false, false, null, true)
        `, [a.id]);
        console.log('Inserted default leave_types for admin_id:', a.id);
      }
    }
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
})();

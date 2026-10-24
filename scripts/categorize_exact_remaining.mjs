import fs from 'fs';

const audit = JSON.parse(fs.readFileSync('scripts/exact_audit.json', 'utf8'));
const rem = audit.remaining;

const categories = {
  duplicate_aliases: [],
  desktop_agent_workers: [],
  db_cleanup_maintenance: [],
  mobile_dedicated: [],
  superseded_auth: [],
  internal_double_prefix: []
};

for (const r of rem) {
  if (r.path.startsWith('/api/users')) {
    categories.duplicate_aliases.push(r);
  } else if (
    r.path.includes('/sync') || 
    r.path.includes('/push-to-tally') || 
    r.path.includes('/mark-') || 
    r.path.includes('/reconcile') || 
    r.path.includes('/ensure-voucher-bill-map') ||
    r.path.startsWith('/company/sync-start')
  ) {
    categories.desktop_agent_workers.push(r);
  } else if (r.path.includes('/cleanup') || r.path === '/check-db') {
    categories.db_cleanup_maintenance.push(r);
  } else if (r.path.startsWith('/api/mobile')) {
    categories.mobile_dedicated.push(r);
  } else if (r.path.includes('reset') || r.path.includes('approve-reset')) {
    categories.superseded_auth.push(r);
  } else {
    categories.internal_double_prefix.push(r);
  }
}

console.log('TOTAL REMAINING:', rem.length);

for (const [k, v] of Object.entries(categories)) {
  console.log(`\n=== ${k.toUpperCase()} (${v.length}) ===`);
  v.forEach(x => console.log(`  ${x.method} ${x.path} -> ${x.file}`));
}

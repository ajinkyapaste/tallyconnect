const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// Ensure company_guid is sent in the query for vouchers
if (!app.includes('company_guid: companyGuid') && app.includes('/voucher-entry/paged')) {
  app = app.replace(
    /api\.get\('\/voucher-entry\/paged',\s*\{([^}]*)\}/,
    "api.get('/voucher-entry/paged', {$1, company_guid: companyGuid}"
  );
  fs.writeFileSync('src/App.jsx', app);
  console.log("Injected company_guid into VoucherExplore");
} else {
  console.log("Already has it or failed to find");
}

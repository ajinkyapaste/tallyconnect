const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Pass companyGuid to LedgerList
app = app.replace('const LedgerList = ({ externalQuery, setCurrentTab }) => {', 'const LedgerList = ({ companyGuid, externalQuery, setCurrentTab }) => {');
app = app.replace("api.get('/ledger')", "api.get('/ledger', { company_guid: companyGuid })");

app = app.replace(/api\.get\('\/ledger'\)[\s\S]*?  \}, \[\]\);/g, (match) => {
    return match.replace("}, []);", "}, [companyGuid]);");
});

const ledgerHeader = `<div style={{ flex: 1 }}>
          <h1>Chart of Accounts</h1>
          <p>Manage ledgers from your active company</p>
        </div>`;
const ledgerHeaderNew = `<div style={{ flex: 1 }}>
          <h1>Chart of Accounts</h1>
          <p>Manage ledgers from your active company</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => alert('Export CSV API will be called')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             Export CSV
          </button>
          <button className="btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             Export PDF
          </button>
        </div>`;
app = app.replace(ledgerHeader, ledgerHeaderNew);

// 2. Pass companyGuid to Orders
app = app.replace('const Orders = ({ externalQuery, setCurrentTab }) => {', 'const Orders = ({ companyGuid, externalQuery, setCurrentTab }) => {');
app = app.replace("api.get('/orders')", "api.get('/orders', { company_guid: companyGuid })");

app = app.replace(/useEffect\(\(\) => \{\n\s+let alive = true;\n\s+api\.get\('\/orders'[\s\S]*?  \}, \[\]\);/, (m, p1) => {
  return m.replace('}, []);', '}, [companyGuid]);');
});

// 3. Pass companyGuid to VoucherExplore
app = app.replace('const VoucherExplore = ({ externalQuery, setCurrentTab }) => {', 'const VoucherExplore = ({ companyGuid, externalQuery, setCurrentTab }) => {');
app = app.replace('}, [page, search, type, year, sort]);', '}, [page, search, type, year, sort, companyGuid]);');

// 4. Update renderContent to pass companyGuid
app = app.replace('<LedgerList externalQuery={headerQuery} setCurrentTab={setCurrentTab} />', '<LedgerList companyGuid={companyGuid} externalQuery={headerQuery} setCurrentTab={setCurrentTab} />');
app = app.replace('<Orders externalQuery={headerQuery} setCurrentTab={setCurrentTab} />', '<Orders companyGuid={companyGuid} externalQuery={headerQuery} setCurrentTab={setCurrentTab} />');
app = app.replace('<VoucherExplore externalQuery={headerQuery} setCurrentTab={setCurrentTab} />', '<VoucherExplore companyGuid={companyGuid} externalQuery={headerQuery} setCurrentTab={setCurrentTab} />');

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx updated successfully!');

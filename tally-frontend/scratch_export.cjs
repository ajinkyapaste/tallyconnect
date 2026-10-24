const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const exportScript = `const exportCSV = () => {
    if (!rows.length) return alert('No data to export');
    const headers = ['Name', 'Group', 'Opening', 'Closing'];
    const csvRows = [headers.join(',')];
    rows.forEach(r => {
      csvRows.push([r.name, r.parent_group, r.opening_balance, r.closing_balance].map(v => '"' + (v || '') + '"').join(','));
    });
    const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ledgers.csv';
    a.click();
  };

  const exportPDF = () => {
    window.print();
  };`;

// Replace the placeholder alert with the actual export function
app = app.replace("onClick={() => alert('Export CSV API will be called')}", "onClick={exportCSV}");
app = app.replace("onClick={() => window.print()}", "onClick={exportPDF}");

// Insert export functions right after baseQuery declaration in LedgerList
app = app.replace("const baseQuery = query || externalQuery || '';", `${exportScript}\n\n  const baseQuery = query || externalQuery || '';`);

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx CSV Export updated successfully!');

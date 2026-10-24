const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// normalize CRLF to LF
code = code.replace(/\r\n/g, '\n');

// Replace fetchCompanies
code = code.replace(
  /const fetchCompanies = async \(\) => \{\n    setLoading\(true\);\n    try \{\n      const res = await api\.get\('\/company'\);\n      if \(res\.success\) \{\n        setCompanies\(res\.data \|\| \[\]\);\n      \}\n    \} catch \(err\) \{\n      setError\(err\.message\);\n    \} finally \{\n      setLoading\(false\);\n    \}\n  \};\n/,
  `const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company');
      const resSelected = await api.get('/company/selected');
      if (res.success) {
        setCompanies(res.data || []);
      }
      if (resSelected.success) {
        setSelectedCompanies(resSelected.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (guid) => {
    try {
      const res = await api.post('/company/select', { company_guid: guid });
      if (res.success) {
        alert('Company selected successfully!');
        fetchCompanies();
      } else {
        alert(res.message || 'Failed to select company');
      }
    } catch (err) {
      alert(err.message || 'Error selecting company');
    }
  };\n`
);

// Replace the map function
code = code.replace(
  /companies\.map\(c => \(\n              <div key=\{c\.company_guid\} style=\{\{\n                padding: 16,\n                borderRadius: 12,\n                background: c\.company_guid === companyGuid \? 'rgba\(52, 199, 89, 0\.15\)' : 'var\(--glass-bg\)',\n                border: c\.company_guid === companyGuid \? '1px solid var\(--success\)' : '1px solid var\(--glass-border\)',\n                display: 'flex',\n                justifyContent: 'space-between',\n                alignItems: 'center'\n              \}\}>\n                <div>\n                  <h4 style=\{\{ margin: '0 0 4px 0', fontSize: 16 \}\}>\{c\.name\}<\/h4>\n                  <div style=\{\{ fontSize: 12, color: 'var\(--text-muted\)' \}\}>\{c\.company_guid\}<\/div>\n                <\/div>\n                \{c\.company_guid === companyGuid \? \(\n                  <div style=\{\{ display: 'flex', alignItems: 'center', gap: 6, color: 'var\(--success\)', fontWeight: 600, fontSize: 13 \}\}>\n                    <CheckCircle2 size=\{16\} \/> Active\n                  <\/div>\n                \) : \(\n                  <button\n                    className="btn-secondary"\n                    style=\{\{ padding: '6px 12px', fontSize: 13 \}\}\n                    onClick=\{\(\) => handleSetActive\(c\.company_guid\)\}\n                  >\n                    Set Active\n                  <\/button>\n                \)\}\n              <\/div>\n            \)\)/,
  `companies.map(c => {
              const isSelected = selectedCompanies.some(sc => sc.company_guid === c.company_guid);
              return (
                <div key={c.company_guid} style={{
                  padding: 16,
                  borderRadius: 12,
                  background: c.company_guid === companyGuid ? 'rgba(52, 199, 89, 0.15)' : 'var(--glass-bg)',
                  border: c.company_guid === companyGuid ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{c.name}</h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.company_guid}</div>
                  </div>
                  {c.company_guid === companyGuid ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>
                      <CheckCircle2 size={16} /> Active
                    </div>
                  ) : isSelected ? (
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => handleSetActive(c.company_guid)}
                    >
                      Set Active
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => handleSelectCompany(c.company_guid)}
                    >
                      Select Company
                    </button>
                  )}
                </div>
              );
            })`
);

fs.writeFileSync('src/App.jsx', code);
console.log("Updated App.jsx successfully!");

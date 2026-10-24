const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace fetchCompanies
code = code.replace(
  /const fetchCompanies = async \(\) => \{[\s\S]*?finally \{[\s\S]*?\}[\s\S]*?\};\n/,
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
  };\n\n  const handleSelectCompany = async (guid) => {
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
  /companies\.map\(c => \([\s\S]*?onClick=\{\(\) => handleSetActive\(c\.company_guid\)\}[\s\S]*?<\/button>\s*\n\s*\)\}\s*<\/div>\s*\)\)/,
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

const fs = require('fs');

let content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8').replace(/\r\n/g, '\n');

// Target snippet in recovered_App.jsx that was corrupted
const targetStart = `            </select>
          </div>

          
                </div>
                <div className="summary-card" style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>Total Credit</h4>`;

const cleanReplacement = `            </select>
          </div>

          <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', boxShadow: 'none', gap: '3px' }}>
            <button
              onClick={() => setViewMode('chart')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'chart' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'chart' ? '#fff' : 'var(--text-muted)',
                boxShadow: viewMode === 'chart' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Chart View
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'table' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Table View
            </button>
          </div>

          <ExportDropdown onExportCSV={exportCSV} onExportPDF={exportPDF} />
        </div>
      </div>

      {loading && (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>
          Loading monthly summary...
        </div>
      )}

      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div className="glass-panel summary-card" style={{ transition: 'all 0.2s ease' }}>
              <div className="summary-card-header">
                <h3>Total Credit (Sales)</h3>
                <div className="summary-card-icon" style={{ background: 'rgba(0, 122, 255, 0.12)', color: 'var(--primary-color)' }}>
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className="amount">{inr(totalCredit)}</div>
              <div className="trend">
                <span style={{ color: 'var(--primary-color)' }}>
                  {data.filter(r => r.credit > 0).length} active turnover month{data.filter(r => r.credit > 0).length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="glass-panel summary-card" style={{ transition: 'all 0.2s ease' }}>
              <div className="summary-card-header">
                <h3>Total Debit (Returns)</h3>
                <div className="summary-card-icon" style={{ background: 'rgba(255, 59, 48, 0.12)', color: '#ff3b30' }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="amount">{inr(totalDebit)}</div>
              <div className="trend">
                <span style={{ color: '#ff3b30' }}>
                  {data.filter(r => r.debit > 0).length} active debit month{data.filter(r => r.debit > 0).length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="glass-panel summary-card" style={{ transition: 'all 0.2s ease' }}>
              <div className="summary-card-header">
                <h3>Net Movement</h3>
                <div className="summary-card-icon" style={{ background: totalClosingBalance >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)', color: totalClosingBalance >= 0 ? '#34c759' : '#ff3b30' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="amount" style={{ color: totalClosingBalance >= 0 ? '#34c759' : '#ff3b30' }}>
                {inr(totalClosingBalance)}
              </div>
              <div className="trend">
                <span>Year-to-date closing</span>
              </div>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
              <div className="glass-panel chart-card">
                <div className="chart-header">
                  <div>
                    <h3>Monthly Credit & Debit</h3>
                    <p>Turnover vs returns breakdown per month</p>
                  </div>
                </div>
                <MonthlyCreditDebitChart data={data} onSelectMonth={(m) => setDrillMonth(m)} />
              </div>

              <div className="glass-panel chart-card">
                <div className="chart-header">
                  <div>
                    <h3>Cumulative Balance Trend</h3>
                    <p>Running net financial position across the year</p>
                  </div>
                </div>
                <ClosingBalanceTrendChart data={data} onSelectMonth={(m) => setDrillMonth(m)} />
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ borderRadius: '20px', padding: '16px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="ios-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Particulars</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                      <th style={{ textAlign: 'right' }}>Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} onClick={() => setDrillMonth(r)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>{r.monthLabel}</td>
                        <td style={{ textAlign: 'right', color: '#ff3b30' }}>{inr(r.debit)}</td>
                        <td style={{ textAlign: 'right', color: '#34c759' }}>{inr(r.credit)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{inr(r.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 800, borderTop: '2px solid var(--glass-border)' }}>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'right', color: '#ff3b30' }}>{inr(totalDebit)}</td>
                      <td style={{ textAlign: 'right', color: '#34c759' }}>{inr(totalCredit)}</td>
                      <td style={{ textAlign: 'right' }}>{inr(totalClosingBalance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drill-down Modal for Month */}
      {drillMonth && createPortal(
        <div
          className="fade-in modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setDrillMonth(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '28px',
              borderRadius: '24px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-dark)' }}>
                  {drillMonth.monthLabel} Details
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Monthly voucher breakdown and financial summary
                </p>
              </div>
              <button
                className="icon-btn"
                onClick={() => setDrillMonth(null)}
                style={{ borderRadius: '50%', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="summary-card" style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>Total Debit</h4>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff3b30' }}>{inr(drillMonth.debit)}</div>
                </div>
                <div className="summary-card" style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>Total Credit</h4>`;

if (!content.includes(targetStart.replace(/\r\n/g, '\n'))) {
  console.error('targetStart not found!');
  process.exit(1);
}

const fixed = content.replace(targetStart.replace(/\r\n/g, '\n'), cleanReplacement.replace(/\r\n/g, '\n'));
console.log('Fixed content length:', fixed.length, 'lines:', fixed.split('\n').length);

fs.writeFileSync('d:/Prototype/tally-frontend/src/App.jsx', fixed, 'utf8');
console.log('Successfully written clean App.jsx to d:/Prototype/tally-frontend/src/App.jsx!');

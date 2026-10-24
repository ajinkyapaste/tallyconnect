const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix .party-right layout in LedgerList
const oldPartyRight = `                <div className="party-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="party-balance" style={{ color: l.balance < 0 ? '#ff3b30' : 'var(--text-dark)' }}>{inr(l.balance)}</div>
                    <div className="party-meta">{l.date ? \`Last \${shortDate(l.date)}\` : 'No activity'}</div>
                  </div>
                  <button
                    type="button"
                    className="tile-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuLedger(l);
                    }}
                    title="Ledger options"
                    aria-label="Options"
                    style={{ marginLeft: '4px' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>`;

const newPartyRight = `                <div className="party-right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div className="party-balance-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', textAlign: 'right' }}>
                    <div className="party-balance" style={{ color: l.balance < 0 ? '#ff3b30' : 'var(--text-dark)', fontWeight: 800 }}>{inr(l.balance)}</div>
                    <div className="party-meta" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.date ? \`Last \${shortDate(l.date)}\` : 'No activity'}</div>
                  </div>
                  <button
                    type="button"
                    className="tile-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuLedger(l);
                    }}
                    title="Ledger options"
                    aria-label="Options"
                    style={{ flexShrink: 0, padding: '6px', borderRadius: '8px' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>`;

if (content.includes(oldPartyRight)) {
  content = content.replace(oldPartyRight, newPartyRight);
  console.log('1. Replaced oldPartyRight');
} else {
  console.warn('1. oldPartyRight not found');
}

// 2. Add kpiContextMenu state to Inventory
const oldKpiState = `  const [draggedKpiId, setDraggedKpiId] = useState(null);
  const [dragOverKpiId, setDragOverKpiId] = useState(null);`;

const newKpiState = `  const [draggedKpiId, setDraggedKpiId] = useState(null);
  const [dragOverKpiId, setDragOverKpiId] = useState(null);
  const [kpiContextMenu, setKpiContextMenu] = useState(null);`;

if (content.includes(oldKpiState)) {
  content = content.replace(oldKpiState, newKpiState);
  console.log('2. Added kpiContextMenu state');
} else {
  console.warn('2. oldKpiState not found');
}

// Update hideKpiCard to sync with master unhide
const oldHideKpi = `  const hideKpiCard = (cardId) => {
    const updated = [...kpiHidden, cardId];
    setKpiHidden(updated);
    localStorage.setItem('tc_items_kpi_hidden', JSON.stringify(updated));
    showToast('KPI card hidden. Restore anytime via "Unhide Cards".');
  };`;

const newHideKpi = `  const hideKpiCard = (cardId) => {
    const updated = [...kpiHidden, cardId];
    setKpiHidden(updated);
    localStorage.setItem('tc_items_kpi_hidden', JSON.stringify(updated));
    try {
      const def = KPI_CARDS_DEF.find((k) => k.id === cardId);
      registerHiddenItem(cardId, def?.title || 'Items KPI', 'Items');
    } catch {}
    window.dispatchEvent(new Event('tc-unhide-sync'));
    showToast('KPI card hidden. Restore anytime via Account > Unhide Hidden Items.');
  };`;

if (content.includes(oldHideKpi)) {
  content = content.replace(oldHideKpi, newHideKpi);
  console.log('3. Updated hideKpiCard');
} else {
  console.warn('3. oldHideKpi not found');
}

// 3. Update items-kpi-card rendering in Inventory: remove permanently visible action buttons, add onContextMenu
const oldKpiCardRender = `                <div className="items-kpi-header">
                  <div
                    className="items-kpi-badge"
                    style={{
                      background: kpi.badgeBg,
                      color: kpi.color,
                      border: \`1.5px solid \${kpi.borderColor}\`
                    }}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </div>

                  <div className="items-kpi-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="items-kpi-drag-handle"
                      title="Drag to reorder card"
                      aria-label="Drag to reorder"
                    >
                      <Move size={13} />
                    </button>
                    <button
                      type="button"
                      className="items-kpi-hide-btn"
                      onClick={() => hideKpiCard(kpi.id)}
                      title="Hide card"
                      aria-label="Hide card"
                    >
                      <EyeOff size={13} />
                    </button>
                  </div>
                </div>`;

const newKpiCardRender = `                <div className="items-kpi-header">
                  <div
                    className="items-kpi-badge"
                    style={{
                      background: kpi.badgeBg,
                      color: kpi.color,
                      border: \`1.5px solid \${kpi.borderColor}\`
                    }}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                </div>`;

if (content.includes(oldKpiCardRender)) {
  content = content.replace(oldKpiCardRender, newKpiCardRender);
  console.log('4. Cleaned items-kpi-actions permanently visible buttons');
} else {
  console.warn('4. oldKpiCardRender not found');
}

// Add onContextMenu and touch hold to items-kpi-card outer div
const oldKpiDiv = `                onClick={() => {
                  if (kpi.clickable && kpi.onClick) kpi.onClick();
                }}
                title={kpi.subtext}`;

const newKpiDiv = `                onClick={() => {
                  if (kpi.clickable && kpi.onClick) kpi.onClick();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setKpiContextMenu({ x: e.clientX, y: e.clientY, kpi });
                }}
                {...createHoldTouchHandler((pos) => setKpiContextMenu({ x: pos.x, y: pos.y, kpi }))}
                title={\`\${kpi.title} • Drag to reorder, right-click for options\`}`;

if (content.includes(oldKpiDiv)) {
  content = content.replace(oldKpiDiv, newKpiDiv);
  console.log('5. Added onContextMenu to items-kpi-card');
} else {
  console.warn('5. oldKpiDiv not found');
}

// Insert kpiContextMenu portal before the Segmented Mode Switcher in Inventory
const oldSegmentedToggle = `      {/* Segmented Mode Switcher: All Items | By Group */}`;
const newSegmentedToggle = `      {/* Context Menu for Items KPI Cards */}
      {kpiContextMenu && createPortal(
        <div
          className="dashboard-context-menu-scrim"
          onClick={() => setKpiContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setKpiContextMenu(null); }}
        >
          <div
            className="dashboard-context-menu glass-panel"
            style={{
              position: 'fixed',
              left: \`\${Math.min(kpiContextMenu.x, window.innerWidth - 180)}px\`,
              top: \`\${Math.min(kpiContextMenu.y, window.innerHeight - 200)}px\`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                hideKpiCard(kpiContextMenu.kpi.id);
                setKpiContextMenu(null);
              }}
            >
              <EyeOff size={14} style={{ color: '#ef4444' }} />
              <span>Hide Card</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                const def = ['items-kpi-total-val', 'items-kpi-items', 'items-kpi-low', 'items-kpi-finished'];
                setKpiOrder(def);
                localStorage.setItem('tc_items_kpi_order', JSON.stringify(def));
                showToast('Card order reset');
                setKpiContextMenu(null);
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Order</span>
            </button>
            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                setShowKpiUnhideModal(true);
                setKpiContextMenu(null);
              }}
            >
              <Eye size={14} style={{ color: 'var(--primary-color)' }} />
              <span>Unhide Cards ({kpiHidden.length})</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Segmented Mode Switcher: All Items | By Group */}`;

if (content.includes(oldSegmentedToggle)) {
  content = content.replace(oldSegmentedToggle, newSegmentedToggle);
  console.log('6. Added kpiContextMenu portal');
} else {
  console.warn('6. oldSegmentedToggle not found');
}

// 4. Remove Bills card-view and view switcher in BillsManager
// Remove switcher buttons
const oldBillsSwitcher = `                {/* View Mode Switcher */}
                <div className="glass-panel" style={{
                  display: 'flex',
                  padding: '3px',
                  borderRadius: '12px',
                  boxShadow: 'none',
                  gap: '3px'
                }}>
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
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: viewMode === 'cards' ? 'var(--primary-color)' : 'transparent',
                      color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                      boxShadow: viewMode === 'cards' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cards
                  </button>
                </div>`;

if (content.includes(oldBillsSwitcher)) {
  content = content.replace(oldBillsSwitcher, '');
  console.log('7. Removed oldBillsSwitcher');
} else {
  console.warn('7. oldBillsSwitcher not found');
}

// In BillsManager, make table view the permanent view without viewMode === 'table' conditional
content = content.replace(
  `{!loading && !error && viewMode === 'table' && (`,
  `{!loading && !error && (`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Finished writing App.jsx polishes');

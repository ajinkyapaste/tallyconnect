const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings for replacement
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Replace party-right layout
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
  console.log('1. Replaced oldPartyRight successfully');
} else {
  console.warn('1. oldPartyRight still not found');
}

// 2. Remove Bills view switcher
const switcherRegex = /\{\/\* View Mode Switcher \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
// Let's be very precise: find the View Mode Switcher div block
const switcherStart = '{/* View Mode Switcher */}';
const idxStart = content.indexOf(switcherStart);
if (idxStart !== -1) {
  // find the end of this div (the container around table & cards button)
  const after = content.slice(idxStart);
  const endDivIdx = after.indexOf('</div>\n                </div>');
  if (endDivIdx !== -1) {
    const toRemove = after.slice(0, endDivIdx + 6); // remove the inner div
    content = content.replace(toRemove, '');
    console.log('2. Removed Bills view mode switcher successfully');
  }
}

// 3. In BillsManager, remove viewMode === 'cards' block entirely and make table permanent
content = content.replace(
  `{!loading && !error && viewMode === 'table' && (`,
  `{!loading && !error && (`
);

const cardsStart = `{!loading && !error && viewMode === 'cards' && (`;
const cIdx = content.indexOf(cardsStart);
if (cIdx !== -1) {
  // Find the end before {filtered.length > 0 && (\n              <Pager
  const targetEnd = `              </div>\n            )}\n\n            {filtered.length > 0 && (\n              <Pager`;
  const endMatch = content.indexOf(targetEnd, cIdx);
  if (endMatch !== -1) {
    const blockToRemove = content.slice(cIdx, endMatch + 21); // up to )}
    content = content.replace(blockToRemove, '');
    console.log('3. Removed Bills viewMode === cards block successfully');
  }
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Finished updating App.jsx');

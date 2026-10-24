const fs = require('fs');
const path = require('path');

console.log('Applying targeted UI/UX polishes across TallyConnect frontend...');

// 1. Update index.css for .party-right
const cssPath = path.join(__dirname, 'tally-frontend', 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace .party-right definition
const oldPartyRight = `.party-right {
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}`;

const newPartyRight = `.party-right {
  text-align: right;
  flex-shrink: 0;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 12px !important;
}

.party-balance-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

/* Hide permanent quick-hide buttons that do not match Dashboard UX */
.items-kpi-actions,
.item-quick-hide-btn {
  display: none !important;
}`;

if (css.includes('.party-right {')) {
  // Replace regardless of CRLF or LF
  css = css.replace(/\.party-right\s*\{[^}]*\}/, newPartyRight);
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✓ index.css updated successfully.');
} else {
  console.log('⚠ Could not find .party-right in index.css');
}

// 2. Update uiUtils.jsx for hidden items registry
const uiUtilsPath = path.join(__dirname, 'tally-frontend', 'src', 'uiUtils.jsx');
let uiUtils = fs.readFileSync(uiUtilsPath, 'utf8');

const extraRegistryItems = `
  // Items & Inventory KPIs
  'items-kpi-total-val': { name: 'Total Stock Value Card', category: 'Items', color: '#e11d48' },
  'items-kpi-items': { name: 'Total Stock Items (SKUs) Card', category: 'Items', color: '#0284c7' },
  'items-kpi-low': { name: 'Running Low Stock Card', category: 'Items', color: '#d97706' },
  'items-kpi-finished': { name: 'Finished Goods Card', category: 'Items', color: '#059669' },

  // Activity KPIs & Cards
  'activity-kpi-total': { name: 'Total Queue Volume Card', category: 'Activity', color: '#2563eb' },
  'activity-kpi-sent': { name: 'Sent & Synced Card', category: 'Activity', color: '#059669' },
  'activity-kpi-waiting': { name: 'Waiting in Queue Card', category: 'Activity', color: '#d97706' },
  'activity-kpi-failed': { name: 'Attention Required Card', category: 'Activity', color: '#e11d48' },

  // Ranked Party & Pending Bills Cards
  'ranked-party-kpi-conc': { name: '#1 Concentration Card', category: 'Ranked Parties', color: '#e11d48' },
  'ranked-party-kpi-avg': { name: 'Average Balance Card', category: 'Ranked Parties', color: '#6366f1' },
  'ranked-party-kpi-pending': { name: 'Pending Bills Summary Card', category: 'Ranked Parties', color: '#10b981' },
  'sales-analytics-spotlight': { name: 'Sales Analytics Spotlight Card', category: 'Reports', color: '#be123c' },
`;

if (!uiUtils.includes('items-kpi-total-val')) {
  uiUtils = uiUtils.replace(
    /export const KNOWN_ITEMS_REGISTRY = \{/,
    `export const KNOWN_ITEMS_REGISTRY = {${extraRegistryItems}`
  );

  const extraKeys = `
  { key: 'tc_items_kpi_hidden', category: 'Items Summary', iconType: 'item' },
  { key: 'tc_activity_kpi_hidden', category: 'Activity Summary', iconType: 'action' },
  { key: 'tc_activity_cards_hidden', category: 'Activity', iconType: 'action' },
  { key: 'tc_insights_hidden', category: 'Financial Insights', iconType: 'report' },
  { key: 'tc_ranked_party_kpi_hidden', category: 'Ranked Parties', iconType: 'ledger' },
  { key: 'tc_ranked_party_rows_hidden', category: 'Ranked Parties', iconType: 'ledger' },
`;

  uiUtils = uiUtils.replace(
    /export const HIDDEN_STORAGE_KEYS = \[/,
    `export const HIDDEN_STORAGE_KEYS = [${extraKeys}`
  );

  fs.writeFileSync(uiUtilsPath, uiUtils, 'utf8');
  console.log('✓ uiUtils.jsx updated with extended registries.');
}

console.log('Script step 1 done.');

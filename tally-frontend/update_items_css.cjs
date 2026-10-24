const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const targetStart = '/* Stock Summary Card */';
const targetEnd = '.group-name-title {';

const idxStart = css.indexOf(targetStart);
const idxEnd = css.indexOf(targetEnd);

console.log('idxStart:', idxStart, 'idxEnd:', idxEnd);
if (idxStart === -1 || idxEnd === -1) {
  console.error('Target not found!');
  process.exit(1);
}

const replacement = `/* Stock Summary Card - Legacy Support */
.stock-summary-card {
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 26px;
  padding: 22px 24px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.stock-value-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stock-cube-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(225, 29, 72, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9f1239;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(225, 29, 72, 0.1);
}

.stock-value-details {
  display: flex;
  flex-direction: column;
}

.stock-value-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.stock-value-amount {
  font-size: clamp(24px, 4.5vw, 34px);
  font-weight: 800;
  color: var(--text-dark);
  letter-spacing: -0.6px;
  line-height: 1.15;
}

.stock-substats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stock-substat-box {
  border-radius: 18px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  border: 1.5px solid transparent;
  user-select: none;
}

.stock-substat-box:hover {
  transform: translateY(-2px);
}

.stock-substat-items {
  background: rgba(226, 232, 240, 0.65);
  color: #1e293b;
}
.stock-substat-items.active {
  border-color: #64748b;
  background: rgba(226, 232, 240, 0.95);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.15);
}

.stock-substat-low {
  background: rgba(254, 243, 199, 0.65);
  color: #92400e;
}
.stock-substat-low.active {
  border-color: #f59e0b;
  background: rgba(254, 243, 199, 0.95);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.18);
}

.stock-substat-finished {
  background: rgba(255, 228, 230, 0.65);
  color: #9f1239;
}
.stock-substat-finished.active {
  border-color: #f43f5e;
  background: rgba(255, 228, 230, 0.95);
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.18);
}

.stock-substat-num {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.stock-substat-lbl {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
}

/* =============================================================
   LIQUID GLASS 4-CARD KPI SYSTEM FOR ITEMS
   ============================================================= */
.items-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

@media (max-width: 1100px) {
  .items-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .items-kpi-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.items-kpi-card {
  position: relative;
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.78));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.22s ease;
  user-select: none;
  overflow: hidden;
}

.items-kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  background: var(--kpi-accent-gradient, linear-gradient(90deg, rgba(225, 29, 72, 0.8), transparent));
  border-radius: 22px 22px 0 0;
}

.items-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.items-kpi-card.clickable {
  cursor: pointer;
}

.items-kpi-card.active {
  border-color: var(--kpi-border-color, #e11d48);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06), 0 0 0 2px var(--kpi-border-color, #e11d48);
  background: var(--glass-card-bg-active, rgba(255, 255, 255, 0.92));
}

.items-kpi-card.is-dragging {
  opacity: 0.45;
  transform: scale(0.96);
  border-style: dashed;
}

.items-kpi-card.drag-over {
  border-color: #e11d48;
  box-shadow: 0 0 0 2px #e11d48, 0 12px 32px rgba(225, 29, 72, 0.15);
}

.items-kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.items-kpi-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 0.2s ease;
}

.items-kpi-card:hover .items-kpi-badge {
  transform: scale(1.06);
}

.items-kpi-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.items-kpi-drag-handle,
.items-kpi-hide-btn {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.035);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.16s ease;
}

.items-kpi-drag-handle {
  cursor: grab;
}
.items-kpi-drag-handle:active {
  cursor: grabbing;
}

.items-kpi-drag-handle:hover,
.items-kpi-hide-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-dark);
  transform: scale(1.08);
}

.items-kpi-hide-btn:hover {
  color: #e11d48;
  background: rgba(225, 29, 72, 0.1);
  border-color: rgba(225, 29, 72, 0.2);
}

.items-kpi-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.items-kpi-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: -0.1px;
}

.items-kpi-value {
  font-size: clamp(22px, 2.2vw, 28px);
  font-weight: 800;
  color: var(--text-dark);
  letter-spacing: -0.6px;
  line-height: 1.15;
}

.items-kpi-sub {
  font-size: 12px;
  color: var(--text-dim);
  font-weight: 500;
  margin-top: 2px;
}

/* Toolbar Unhide Pills */
.btn-unhide-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.btn-unhide-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

/* Segmented View Mode Toggle */
.items-segmented-toggle {
  display: flex;
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 5px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.items-segmented-btn {
  flex: 1;
  padding: 11px 18px;
  border: none;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.items-segmented-btn.active {
  background: var(--glass-bg, #ffffff);
  color: var(--text-dark);
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Quick Filter Pills */
.items-quick-pills-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.items-quick-pills-bar::-webkit-scrollbar {
  display: none;
}

.items-quick-pill {
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.18s ease;
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--text-muted);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.items-quick-pill:hover {
  background: var(--glass-bg, #ffffff);
  color: var(--text-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.items-quick-pill.active {
  background: var(--glass-bg, #ffffff);
  color: var(--text-dark);
  font-weight: 700;
  border-color: rgba(225, 29, 72, 0.4);
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.08);
}

/* Search Bar */
.items-search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.75));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 20px;
  padding: 12px 18px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.items-search-container:focus-within {
  border-color: #e11d48;
  box-shadow: 0 6px 20px rgba(225, 29, 72, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.items-search-input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-dark);
}

.items-search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

/* Item Row Card (Liquid Glass) */
.item-card-row {
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.78));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.18s ease;
  cursor: pointer;
  position: relative;
  user-select: none;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.item-card-row:hover {
  background: var(--glass-bg, #ffffff);
  border-color: rgba(225, 29, 72, 0.25);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
}

.item-card-row.is-pinned {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(245, 247, 255, 0.9);
  box-shadow: 0 4px 18px rgba(99, 102, 241, 0.08);
}

.item-card-row.is-dragging {
  opacity: 0.45;
  transform: scale(0.98);
  border-style: dashed;
}

.item-card-row.drag-over {
  border-top: 3px solid #e11d48;
  box-shadow: 0 4px 20px rgba(225, 29, 72, 0.12);
}

/* Item Drag Handle & Quick Hide */
.item-drag-handle {
  width: 28px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  cursor: grab;
  border-radius: 8px;
  transition: color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.item-drag-handle:hover {
  color: var(--text-dark);
  background: rgba(0, 0, 0, 0.05);
}

.item-drag-handle:active {
  cursor: grabbing;
}

.item-quick-hide-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.item-quick-hide-btn:hover {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
  transform: scale(1.08);
}

.item-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-cube-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(225, 29, 72, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #be123c;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(225, 29, 72, 0.08);
}

.item-details-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.item-name-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.item-meta-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.item-group-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(244, 63, 94, 0.1);
  color: #be123c;
}

.item-pinned-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.08);
  padding: 1px 6px;
  border-radius: 6px;
}

.item-row-right-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-valuation-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-dark);
  text-align: right;
  letter-spacing: -0.2px;
}

.item-valuation-negative {
  color: #b91c1c;
}

.item-menu-dot-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.item-menu-dot-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-dark);
}

/* Group Row Card (Liquid Glass) */
.group-card-row {
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.78));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.group-card-row:hover {
  background: var(--glass-bg, #ffffff);
  border-color: rgba(225, 29, 72, 0.25);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  transform: translateX(3px);
}

.group-grid-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(225, 29, 72, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #be123c;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(225, 29, 72, 0.08);
}

`;

const newCss = css.slice(0, idxStart) + replacement + css.slice(idxEnd);
fs.writeFileSync('src/index.css', newCss, 'utf8');
console.log('Successfully updated src/index.css!');

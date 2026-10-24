import sys

app_path = 'd:/Prototype/tally-frontend/src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update LedgerList: Add preference states
old_ledger_state = """  const [syncTime, setSyncTime] = useState('');

  // Individual Ledger Records drag, pin, and hide states"""

new_ledger_state = """  const [syncTime, setSyncTime] = useState('');
  const [displayMode, setDisplayMode] = useState(() => {
    try { return localStorage.getItem('tc_pref_ledger_mode') || 'cards'; } catch { return 'cards'; }
  });
  const [pageSize, setPageSize] = useState(() => {
    try { return Number(localStorage.getItem('tc_pref_ledger_size')) || 25; } catch { return 25; }
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_pref_ledger_cols');
      return saved ? JSON.parse(saved) : ['name', 'group', 'position', 'balance', 'contact', 'activity'];
    } catch {
      return ['name', 'group', 'position', 'balance', 'contact', 'activity'];
    }
  });

  // Individual Ledger Records drag, pin, and hide states"""

if old_ledger_state in content:
    content = content.replace(old_ledger_state, new_ledger_state, 1)
    print("1. LedgerList state updated")
else:
    print("WARNING 1: old_ledger_state not found")

# 2. Update LedgerList: pages and pageRows calculation
old_ledger_pages = """  const pages = Math.max(1, Math.ceil(filtered.length / LEDGER_PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * LEDGER_PAGE_SIZE, page * LEDGER_PAGE_SIZE);"""

new_ledger_pages = """  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);"""

if old_ledger_pages in content:
    content = content.replace(old_ledger_pages, new_ledger_pages, 1)
    print("2. LedgerList pages calculation updated")
else:
    print("WARNING 2: old_ledger_pages not found")

# 3. Update LedgerList rendering: Table vs Cards view + DisplayPreferencesBar + StandardPagination
old_ledger_render = """      {loaded && pageRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pageRows.map((l, i) => {
            const st = l.position;
            const lKey = getLedgerKey(l);
            const isPinned = isLedgerPinned(l);
            const isDragging = draggedLedgerKey === lKey;
            const isDragOver = dragOverLedgerKey === lKey;
            return (
              <div
                key={l.ledger_guid || `${l.kind}-${i}`}
                className={`party-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                draggable={true}
                onDragStart={(e) => handleLedgerDragStart(e, l)}
                onDragOver={(e) => handleLedgerDragOver(e, l)}
                onDrop={(e) => handleLedgerDrop(e, l)}
                onDragEnd={() => {
                  setDraggedLedgerKey(null);
                  setDragOverLedgerKey(null);
                  setTimeout(() => { wasDraggingLedgerRef.current = false; }, 200);
                }}
                onClick={() => {
                  if (wasDraggingLedgerRef.current) return;
                  openDetail(l);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuLedger(l);
                }}
                {...createHoldTouchHandler(() => setMenuLedger(l))}
                title={`Open ${l.name} • Drag to reorder, hold for options`}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="party-avatar" style={{ background: avatarColor(l) }}>{initials(l.name)}</div>
                <div className="party-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="party-name">{l.name || '—'}</div>
                    {isPinned && (
                      <span className="item-pinned-tag">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="party-sub">{l.parent_group || 'General'}{l.type && l.type !== 'General' ? ` • ${l.type}` : ''}</div>
                  <div className="party-footer">
                    <span className="position-pill" style={{ background: `${st.tone}1f`, color: st.tone }}>{st.label}</span>
                    {l.email && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>✉ {l.email}</span>}
                  </div>
                </div>
                <div className="party-right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div className="party-balance-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', textAlign: 'right' }}>
                    <div className="party-balance" style={{ color: l.balance < 0 ? '#ff3b30' : 'var(--text-dark)', fontWeight: 800 }}>{inr(l.balance)}</div>
                    <div className="party-meta" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.date ? `Last ${shortDate(l.date)}` : 'No activity'}</div>
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
                </div>
              </div>
            );
          })}
          {loaded && filtered.length > LEDGER_PAGE_SIZE && (
            <Pager
              page={page}
              pages={pages}
              total={filtered.length}
              pageSize={LEDGER_PAGE_SIZE}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />
          )}
        </div>
      )}"""

new_ledger_render = """      {loaded && pageRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayMode === 'table' ? (
            <div className="table-responsive-container">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    {visibleColumns.includes('name') && <th>Name</th>}
                    {visibleColumns.includes('group') && <th>Group / Type</th>}
                    {visibleColumns.includes('position') && <th>Position</th>}
                    {visibleColumns.includes('balance') && <th style={{ textAlign: 'right' }}>Closing Balance</th>}
                    {visibleColumns.includes('contact') && <th>Contact</th>}
                    {visibleColumns.includes('activity') && <th>Last Activity</th>}
                    <th style={{ textAlign: 'center', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l, i) => {
                    const st = l.position;
                    const isPinned = isLedgerPinned(l);
                    return (
                      <tr
                        key={l.ledger_guid || `tbl-${l.kind}-${i}`}
                        onClick={() => openDetail(l)}
                        style={{ cursor: 'pointer', background: isPinned ? 'rgba(99, 102, 241, 0.05)' : undefined }}
                        title="Click to view details"
                      >
                        {visibleColumns.includes('name') && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="party-avatar" style={{ width: '28px', height: '28px', fontSize: '11px', background: avatarColor(l) }}>
                                {initials(l.name)}
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{l.name || '—'}</span>
                              {isPinned && <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px' }}><Pin size={9} /> Pinned</span>}
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('group') && (
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                              {l.parent_group || 'General'}{l.type && l.type !== 'General' ? ` • ${l.type}` : ''}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('position') && (
                          <td>
                            <span className="position-pill" style={{ background: `${st.tone}1f`, color: st.tone, padding: '3px 8px', fontSize: '11px' }}>
                              {st.label}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('balance') && (
                          <td style={{ textAlign: 'right', fontWeight: 800, color: l.balance < 0 ? '#ff3b30' : 'var(--text-dark)' }}>
                            {inr(l.balance)}
                          </td>
                        )}
                        {visibleColumns.includes('contact') && (
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {l.email ? `✉ ${l.email}` : (l.phone ? `📞 ${l.phone}` : '—')}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('activity') && (
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {l.date ? shortDate(l.date) : 'No activity'}
                            </span>
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => setMenuLedger(l)}
                            title="Options"
                            style={{ padding: '4px 8px' }}
                          >
                            <MoreVertical size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pageRows.map((l, i) => {
                const st = l.position;
                const lKey = getLedgerKey(l);
                const isPinned = isLedgerPinned(l);
                const isDragging = draggedLedgerKey === lKey;
                const isDragOver = dragOverLedgerKey === lKey;
                return (
                  <div
                    key={l.ledger_guid || `${l.kind}-${i}`}
                    className={`party-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    draggable={true}
                    onDragStart={(e) => handleLedgerDragStart(e, l)}
                    onDragOver={(e) => handleLedgerDragOver(e, l)}
                    onDrop={(e) => handleLedgerDrop(e, l)}
                    onDragEnd={() => {
                      setDraggedLedgerKey(null);
                      setDragOverLedgerKey(null);
                      setTimeout(() => { wasDraggingLedgerRef.current = false; }, 200);
                    }}
                    onClick={() => {
                      if (wasDraggingLedgerRef.current) return;
                      openDetail(l);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuLedger(l);
                    }}
                    {...createHoldTouchHandler(() => setMenuLedger(l))}
                    title={`Open ${l.name} • Drag to reorder, hold for options`}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <div className="party-avatar" style={{ background: avatarColor(l) }}>{initials(l.name)}</div>
                    <div className="party-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="party-name">{l.name || '—'}</div>
                        {isPinned && (
                          <span className="item-pinned-tag">
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="party-sub">{l.parent_group || 'General'}{l.type && l.type !== 'General' ? ` • ${l.type}` : ''}</div>
                      <div className="party-footer">
                        <span className="position-pill" style={{ background: `${st.tone}1f`, color: st.tone }}>{st.label}</span>
                        {l.email && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>✉ {l.email}</span>}
                      </div>
                    </div>
                    <div className="party-right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div className="party-balance-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', textAlign: 'right' }}>
                        <div className="party-balance" style={{ color: l.balance < 0 ? '#ff3b30' : 'var(--text-dark)', fontWeight: 800 }}>{inr(l.balance)}</div>
                        <div className="party-meta" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.date ? `Last ${shortDate(l.date)}` : 'No activity'}</div>
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DisplayPreferencesBar
            viewMode={displayMode}
            onViewModeChange={(m) => {
              setDisplayMode(m);
              try { localStorage.setItem('tc_pref_ledger_mode', m); } catch {}
            }}
            pageSize={pageSize}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
              try { localStorage.setItem('tc_pref_ledger_size', String(sz)); } catch {}
            }}
            columns={[
              { id: 'name', label: 'Name' },
              { id: 'group', label: 'Group / Type' },
              { id: 'position', label: 'Position' },
              { id: 'balance', label: 'Closing Balance' },
              { id: 'contact', label: 'Contact' },
              { id: 'activity', label: 'Last Activity' }
            ]}
            visibleColumns={visibleColumns}
            onColumnToggle={(colId) => {
              const next = visibleColumns.includes(colId) ? visibleColumns.filter(c => c !== colId) : [...visibleColumns, colId];
              setVisibleColumns(next);
              try { localStorage.setItem('tc_pref_ledger_cols', JSON.stringify(next)); } catch {}
            }}
            sortOptions={[
              { value: 'balance_desc', label: 'Balance: High → Low' },
              { value: 'balance_asc', label: 'Balance: Low → High' },
              { value: 'az', label: 'Name: A → Z' },
              { value: 'za', label: 'Name: Z → A' },
            ]}
            currentSort={sort}
            onSortChange={(s) => setSort(s)}
          />

          <StandardPagination
            currentPage={page}
            totalPages={pages}
            totalRecords={filtered.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
              try { localStorage.setItem('tc_pref_ledger_size', String(sz)); } catch {}
            }}
          />
        </div>
      )}"""

if old_ledger_render in content:
    content = content.replace(old_ledger_render, new_ledger_render, 1)
    print("3. LedgerList rendering updated")
else:
    print("WARNING 3: old_ledger_render not found")

# 4. Update Inventory: Add preference states
old_inv_state = """  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);"""

new_inv_state = """  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [displayMode, setDisplayMode] = useState(() => {
    try { return localStorage.getItem('tc_pref_inv_mode') || 'cards'; } catch { return 'cards'; }
  });
  const [pageSize, setPageSize] = useState(() => {
    try { return Number(localStorage.getItem('tc_pref_inv_size')) || 25; } catch { return 25; }
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_pref_inv_cols');
      return saved ? JSON.parse(saved) : ['name', 'group', 'closing', 'rate', 'value', 'status'];
    } catch {
      return ['name', 'group', 'closing', 'rate', 'value', 'status'];
    }
  });
  const [selectedItem, setSelectedItem] = useState(null);"""

if old_inv_state in content:
    content = content.replace(old_inv_state, new_inv_state, 1)
    print("4. Inventory state updated")
else:
    print("WARNING 4: old_inv_state not found")

# 5. Update Inventory pages calculation
old_inv_pages = """  const totalPages = Math.max(1, Math.ceil(filteredItems.length / INVENTORY_PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * INVENTORY_PAGE_SIZE, page * INVENTORY_PAGE_SIZE);"""

new_inv_pages = """  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);"""

if old_inv_pages in content:
    content = content.replace(old_inv_pages, new_inv_pages, 1)
    print("5. Inventory pages calculation updated")
else:
    print("WARNING 5: old_inv_pages not found")

# 6. Update Inventory bottom pagination & display preferences
old_inv_bottom = """      {filteredItems.length > INVENTORY_PAGE_SIZE && (
        <Pager
          page={page}
          pages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          total={filteredItems.length}
          pageSize={INVENTORY_PAGE_SIZE}
        />
      )}"""

new_inv_bottom = """      <DisplayPreferencesBar
        viewMode={displayMode}
        onViewModeChange={(m) => {
          setDisplayMode(m);
          try { localStorage.setItem('tc_pref_inv_mode', m); } catch {}
        }}
        pageSize={pageSize}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
          try { localStorage.setItem('tc_pref_inv_size', String(sz)); } catch {}
        }}
        columns={[
          { id: 'name', label: 'Item Name' },
          { id: 'group', label: 'Stock Group' },
          { id: 'closing', label: 'Stock Quantity' },
          { id: 'rate', label: 'Standard Rate' },
          { id: 'value', label: 'Valuation' },
          { id: 'status', label: 'Status' }
        ]}
        visibleColumns={visibleColumns}
        onColumnToggle={(colId) => {
          const next = visibleColumns.includes(colId) ? visibleColumns.filter(c => c !== colId) : [...visibleColumns, colId];
          setVisibleColumns(next);
          try { localStorage.setItem('tc_pref_inv_cols', JSON.stringify(next)); } catch {}
        }}
      />

      <StandardPagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={filteredItems.length}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
          try { localStorage.setItem('tc_pref_inv_size', String(sz)); } catch {}
        }}
      />"""

if old_inv_bottom in content:
    content = content.replace(old_inv_bottom, new_inv_bottom, 1)
    print("6. Inventory bottom pagination updated")
else:
    print("WARNING 6: old_inv_bottom not found")

# 7. Update Inventory viewMode === 'all' to support table view
old_inv_grid = """        <div className="grid-3" style={{ gap: '16px' }}>
          {pageItems.map((item, idx) => {"""

new_inv_grid = """        {displayMode === 'table' ? (
          <div className="table-responsive-container">
            <table className="standard-data-table">
              <thead>
                <tr>
                  {visibleColumns.includes('name') && <th>Item Name</th>}
                  {visibleColumns.includes('group') && <th>Stock Group</th>}
                  {visibleColumns.includes('closing') && <th style={{ textAlign: 'right' }}>Quantity</th>}
                  {visibleColumns.includes('rate') && <th style={{ textAlign: 'right' }}>Rate</th>}
                  {visibleColumns.includes('value') && <th style={{ textAlign: 'right' }}>Total Value</th>}
                  {visibleColumns.includes('status') && <th>Status</th>}
                  <th style={{ textAlign: 'center', width: '60px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const isPinned = pinnedKeys.includes(item.id) || pinnedKeys.includes(item.name);
                  const st = statusOf(item.closing);
                  return (
                    <tr
                      key={item.id || `inv-tbl-${idx}`}
                      onClick={() => openItemDetail(item)}
                      style={{ cursor: 'pointer', background: isPinned ? 'rgba(99, 102, 241, 0.05)' : undefined }}
                      title="Click to view item details"
                    >
                      {visibleColumns.includes('name') && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={16} color="var(--primary-color)" />
                            <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{item.name}</span>
                            {isPinned && <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px' }}><Pin size={9} /> Pinned</span>}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('group') && <td><span style={{ color: 'var(--text-muted)' }}>{item.group || 'General'}</span></td>}
                      {visibleColumns.includes('closing') && <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(item.closing || 0).toLocaleString('en-IN')} {item.unit || 'Pcs'}</td>}
                      {visibleColumns.includes('rate') && <td style={{ textAlign: 'right' }}>{inr(item.rate || 0)}</td>}
                      {visibleColumns.includes('value') && <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)' }}>{inr(item.value || (item.closing * item.rate) || 0)}</td>}
                      {visibleColumns.includes('status') && <td><span className={`badge ${st.cls}`}>{st.label}</span></td>}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="tile-menu-btn"
                          onClick={() => setMenuItem(item)}
                          title="Options"
                          style={{ padding: '4px 8px' }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="grid-3" style={{ gap: '16px' }}>
          {pageItems.map((item, idx) => {"""

if old_inv_grid in content:
    # also close the ternary where the grid ends
    content = content.replace(old_inv_grid, new_inv_grid, 1)
    print("7. Inventory table view added to grid")
else:
    print("WARNING 7: old_inv_grid not found")

# Close the ternary for Inventory grid
old_inv_grid_close = """          })}
        </div>"""

# Check where the grid closes in viewMode === 'all'
# It's right before `{filteredItems.length === 0 && (`
target_grid_close = """          })}
        </div>

        {filteredItems.length === 0 && ("""

new_grid_close = """          })}
        </div>
        )}

        {filteredItems.length === 0 && ("""

if target_grid_close in content:
    content = content.replace(target_grid_close, new_grid_close, 1)
    print("8. Inventory grid ternary closed properly")
else:
    print("WARNING 8: target_grid_close not found")

# 9. Update SettingsHub: Accept user and onOpenAdminVisibility
old_settings_sig = """const SettingsHub = ({
  primaryColor, setPrimaryColor,
  bgImage, setBgImage,
  glassOpacity, setGlassOpacity,
  darkMode, setDarkMode,
  autoSync, setAutoSync,
  language, setLanguage,
  onOpenMasterUnhide,
}) => {"""

new_settings_sig = """const SettingsHub = ({
  primaryColor, setPrimaryColor,
  bgImage, setBgImage,
  glassOpacity, setGlassOpacity,
  darkMode, setDarkMode,
  autoSync, setAutoSync,
  language, setLanguage,
  onOpenMasterUnhide,
  user,
  onOpenAdminVisibility,
}) => {"""

if old_settings_sig in content:
    content = content.replace(old_settings_sig, new_settings_sig, 1)
    print("9. SettingsHub signature updated")
else:
    print("WARNING 9: old_settings_sig not found")

# 10. Add Administrator Visibility card inside SettingsHub
old_settings_end = """      {/* Wallpaper File Input */}
      <input
        ref={bgFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleBgUpload}
      />"""

new_settings_end = """      {user?.role === 'ADMIN' && (
        <div style={{ marginTop: '32px' }}>
          <h3 className="section-title">Organization Display &amp; Visibility Controls</h3>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} style={{ color: 'var(--primary-color)' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Administrator Visibility Manager</h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px' }}>
                Centrally configure which navigation tabs, dashboard KPI cards, and financial report sections are visible to standard users.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={onOpenAdminVisibility}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px' }}
            >
              <Sliders size={16} /> Manage Visibility
            </button>
          </div>
        </div>
      )}

      {/* Wallpaper File Input */}
      <input
        ref={bgFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleBgUpload}
      />"""

if old_settings_end in content:
    content = content.replace(old_settings_end, new_settings_end, 1)
    print("10. Admin Visibility controls added to SettingsHub")
else:
    print("WARNING 10: old_settings_end not found")

# 11. In App(): Add showAdminVisibilityModal and adminVisKey state
old_app_prefs = """  /* Persisted appearance / app preferences */
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('tc_color') || '#007aff');"""

new_app_prefs = """  /* Persisted appearance / app preferences */
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('tc_color') || '#007aff');
  const [showAdminVisibilityModal, setShowAdminVisibilityModal] = useState(false);
  const [adminVisKey, setAdminVisKey] = useState(0);

  React.useEffect(() => {
    const handleVisSync = () => setAdminVisKey((k) => k + 1);
    window.addEventListener('tc-admin-visibility-sync', handleVisSync);
    return () => window.removeEventListener('tc-admin-visibility-sync', handleVisSync);
  }, []);"""

if old_app_prefs in content:
    content = content.replace(old_app_prefs, new_app_prefs, 1)
    print("11. App() state and sync listener added")
else:
    print("WARNING 11: old_app_prefs not found")

# 12. In App(): Update theme effect to set RGB variables and fire tc-theme-change
old_theme_effect = """  /* Apply + persist preferences */
  React.useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--bg-image', `url('${bgImage}')`);
    applyGlassSettings({ opacity: glassOpacity, ...getSavedGlassSettings() }, darkMode);
    document.documentElement.style.setProperty('--bg-tint', darkMode ? 'rgba(15, 18, 25, 0.65)' : 'rgba(255, 255, 255, 0)');

    // Auto-switch text colors for dark mode with high-contrast legibility
    document.documentElement.style.setProperty('--text-dark', darkMode ? '#ffffff' : '#0f172a');
    document.documentElement.style.setProperty('--text-muted', darkMode ? '#e2e8f0' : '#1e293b');
    document.documentElement.style.setProperty('--glass-hover', darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)');

    // Persist best-effort: an uploaded wallpaper can be large, and a full
    // localStorage quota must not crash the settings effect.
    try {
      localStorage.setItem('tc_color', primaryColor);
      localStorage.setItem('tc_bg', bgImage);
      localStorage.setItem('tc_glass', String(glassOpacity));
      localStorage.setItem('tc_dark', darkMode ? '1' : '0');
      localStorage.setItem('tc_lang', language);
    } catch {
      /* storage full or unavailable — preferences still apply for this session */
    }
  }, [primaryColor, bgImage, glassOpacity, darkMode, language]);"""

new_theme_effect = """  /* Apply + persist preferences */
  React.useEffect(() => {
    let r = 0, g = 122, b = 255;
    if (primaryColor && primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length >= 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
    }
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--primary-hover', `rgb(${Math.max(0, r - 22)}, ${Math.max(0, g - 22)}, ${Math.max(0, b - 22)})`);
    document.documentElement.style.setProperty('--primary-light', `rgba(${r}, ${g}, ${b}, 0.14)`);
    document.documentElement.style.setProperty('--primary-border', `rgba(${r}, ${g}, ${b}, 0.28)`);
    document.documentElement.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    window.dispatchEvent(new CustomEvent('tc-theme-change', { detail: { primaryColor, rgb: [r, g, b] } }));

    document.documentElement.style.setProperty('--bg-image', `url('${bgImage}')`);
    applyGlassSettings({ opacity: glassOpacity, ...getSavedGlassSettings() }, darkMode);
    document.documentElement.style.setProperty('--bg-tint', darkMode ? 'rgba(15, 18, 25, 0.65)' : 'rgba(255, 255, 255, 0)');

    // Auto-switch text colors for dark mode with high-contrast legibility
    document.documentElement.style.setProperty('--text-dark', darkMode ? '#ffffff' : '#0f172a');
    document.documentElement.style.setProperty('--text-muted', darkMode ? '#e2e8f0' : '#1e293b');
    document.documentElement.style.setProperty('--glass-hover', darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)');

    try {
      localStorage.setItem('tc_color', primaryColor);
      localStorage.setItem('tc_bg', bgImage);
      localStorage.setItem('tc_glass', String(glassOpacity));
      localStorage.setItem('tc_dark', darkMode ? '1' : '0');
      localStorage.setItem('tc_lang', language);
    } catch {
      /* storage full or unavailable */
    }
  }, [primaryColor, bgImage, glassOpacity, darkMode, language]);"""

if old_theme_effect in content:
    content = content.replace(old_theme_effect, new_theme_effect, 1)
    print("12. Theme effect updated with RGB variables and event dispatch")
else:
    print("WARNING 12: old_theme_effect not found")

# 13. Update visibleNavItems and pinnedNavItems to filter by isVisibleToUser
old_nav_items_filter = """  const visibleNavItems = useMemo(() => {
    return allNavItems.filter((item) => !navHidden.includes(item.id));
  }, [allNavItems, navHidden]);"""

new_nav_items_filter = """  const visibleNavItems = useMemo(() => {
    return allNavItems.filter((item) => !navHidden.includes(item.id) && isVisibleToUser(user, 'navTabs', item.id));
  }, [allNavItems, navHidden, user, adminVisKey]);"""

if old_nav_items_filter in content:
    content = content.replace(old_nav_items_filter, new_nav_items_filter, 1)
    print("13. visibleNavItems updated with isVisibleToUser")
else:
    print("WARNING 13: old_nav_items_filter not found")

# 14. Update renderContent() to pass user to Dashboard & SettingsHub and check tab visibility
old_render_dash = "case 'dashboard': return <Dashboard setCurrentTab={setCurrentTab} companyGuid={companyGuid} syncInfo={syncInfo} onQuickAdd={openVoucherCreate} />;"
new_render_dash = """case 'dashboard': return <Dashboard setCurrentTab={setCurrentTab} companyGuid={companyGuid} syncInfo={syncInfo} onQuickAdd={openVoucherCreate} user={user} />;"""

if old_render_dash in content:
    content = content.replace(old_render_dash, new_render_dash, 1)
    print("14. Dashboard render updated with user prop")
else:
    print("WARNING 14: old_render_dash not found")

# Pass user and onOpenAdminVisibility to SettingsHub
old_render_settings = """      case 'settings': return (
        <SettingsHub
          primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}"""

new_render_settings = """      case 'settings': return (
        <SettingsHub
          primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
          user={user}
          onOpenAdminVisibility={() => setShowAdminVisibilityModal(true)}"""

if old_render_settings in content:
    content = content.replace(old_render_settings, new_render_settings, 1)
    print("15. SettingsHub render updated with user and admin callback")
else:
    print("WARNING 15: old_render_settings not found")

# Add guard in renderContent()
old_render_content_start = """  const renderContent = () => {
    switch (currentTab) {"""

new_render_content_start = """  const renderContent = () => {
    if (user?.role !== 'ADMIN' && !isVisibleToUser(user, 'navTabs', currentTab) && currentTab !== 'dashboard') {
      return (
        <div className="fade-in glass-panel" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '540px', margin: '40px auto', borderRadius: '24px' }}>
          <Shield size={44} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-dark)' }}>Module Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            This page has been hidden by your organization's administrator display settings.
          </p>
          <button className="btn-primary" onClick={() => setCurrentTab('dashboard')}>
            Return to Dashboard
          </button>
        </div>
      );
    }
    switch (currentTab) {"""

if old_render_content_start in content:
    content = content.replace(old_render_content_start, new_render_content_start, 1)
    print("16. renderContent() guard added")
else:
    print("WARNING 16: old_render_content_start not found")

# 17. Update Sidebar brand with official TallyConnectLogo
old_sidebar_brand = """      {/* Responsive Glass Sidebar */}
      <div className={`glass-panel glass-sidebar ${sidebarOpen ? 'open' : ''} ${railMode ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Grid size={20} />
          </div>
          <h2 className="brand-name">TallyConnect</h2>
        </div>"""

new_sidebar_brand = """      {/* Responsive Glass Sidebar */}
      <div className={`glass-panel glass-sidebar ${sidebarOpen ? 'open' : ''} ${railMode ? 'collapsed' : ''}`}>
        <div
          className="brand"
          style={{
            cursor: 'pointer',
            padding: railMode ? '12px 6px' : '16px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: railMode ? 'center' : 'flex-start'
          }}
          onClick={() => setCurrentTab('dashboard')}
          title="TallyConnect Dashboard"
        >
          {railMode ? (
            <img src="/favicon.png" alt="TallyConnect" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          ) : (
            <TallyConnectLogo height={32} isDarkMode={darkMode} />
          )}
        </div>"""

if old_sidebar_brand in content:
    content = content.replace(old_sidebar_brand, new_sidebar_brand, 1)
    print("17. Sidebar brand logo updated")
else:
    print("WARNING 17: old_sidebar_brand not found")

# 18. Filter NAV_GROUPS by isVisibleToUser
old_nav_groups_filter = """          {NAV_GROUPS.map((group) => {
            const groupVisibleItems = group.items.filter(
              (item) => !navHidden.includes(item.id) && !navPinned.includes(item.id)
            );"""

new_nav_groups_filter = """          {NAV_GROUPS.map((group) => {
            const groupVisibleItems = group.items.filter(
              (item) => !navHidden.includes(item.id) && !navPinned.includes(item.id) && isVisibleToUser(user, 'navTabs', item.id)
            );"""

if old_nav_groups_filter in content:
    content = content.replace(old_nav_groups_filter, new_nav_groups_filter, 1)
    print("18. NAV_GROUPS filtered by isVisibleToUser")
else:
    print("WARNING 18: old_nav_groups_filter not found")

# 19. User menu: Add Admin Visibility trigger
old_user_menu = """                    {user?.role === 'ADMIN' && (
                      <button type="button" onClick={() => handleNav('users')}><UsersIcon size={16} /> Users &amp; Roles</button>
                    )}"""

new_user_menu = """                    {user?.role === 'ADMIN' && (
                      <>
                        <button type="button" onClick={() => handleNav('users')}><UsersIcon size={16} /> Users &amp; Roles</button>
                        <button type="button" onClick={() => { setUserMenuOpen(false); setShowAdminVisibilityModal(true); }}>
                          <Sliders size={16} /> Visibility Controls
                        </button>
                      </>
                    )}"""

if old_user_menu in content:
    content = content.replace(old_user_menu, new_user_menu, 1)
    print("19. User menu admin visibility button added")
else:
    print("WARNING 19: old_user_menu not found")

# 20. Render AdminVisibilityModal before the end of App
old_app_end = """      {/* Floating Action Menu (Mobile FAB) */}
      <FloatingActionMenu onSelect={handleActionSelect} onQuickAdd={openVoucherCreate} />
    </div>
  );
}"""

new_app_end = """      {/* Floating Action Menu (Mobile FAB) */}
      <FloatingActionMenu onSelect={handleActionSelect} onQuickAdd={openVoucherCreate} />

      {/* Centralized Administrator Visibility Modal */}
      <AdminVisibilityModal
        isOpen={showAdminVisibilityModal}
        onClose={() => setShowAdminVisibilityModal(false)}
        user={user}
      />
    </div>
  );
}"""

if old_app_end in content:
    content = content.replace(old_app_end, new_app_end, 1)
    print("20. AdminVisibilityModal mounted in App")
else:
    print("WARNING 20: old_app_end not found")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished writing updated App.jsx")

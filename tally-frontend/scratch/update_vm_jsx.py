import sys

vm_path = 'd:/Prototype/tally-frontend/src/VoucherManager.jsx'
with open(vm_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update periodLabel
old_period_label = """  // Date Filter Label for Summary
  const periodLabel = activeDateFilter === 'today'
    ? 'Today'
    : activeDateFilter === 'last_7_days'
      ? 'Last 7 days'
      : activeDateFilter === 'this_month'
        ? 'This month'
        : 'All time';"""

new_period_label = """  // Date Filter Label for Summary
  const periodLabel = getStandardDateRangeLabel(activeDateFilter, customStart, customEnd);"""

if old_period_label in content:
    content = content.replace(old_period_label, new_period_label, 1)
    print("1. periodLabel updated")
else:
    print("WARNING 1: old_period_label not found")

# 2. Update overview date pills (around line 968)
old_overview_pills = """          {/* Date Filter Pills (Matches Screenshot 1 top pills) */}
          <div className="voucher-date-pill-bar" style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
            {[
              { id: 'all_time', label: 'All time' },
              { id: 'this_month', label: 'This month' },
              { id: 'last_7_days', label: 'Last 7 days' },
              { id: 'today', label: 'Today' }
            ].map((pill) => {
              const active = activeDateFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveDateFilter(pill.id)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '999px',
                    border: active ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid transparent',
                    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                    color: active ? '#0f172a' : 'var(--text-muted)',
                    fontWeight: active ? 700 : 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 4px 12px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>"""

new_overview_pills = """          {/* Standardized 5-Option Date Filter */}
          <div style={{ marginBottom: '22px' }}>
            <StandardDateFilter
              value={activeDateFilter}
              onChange={(val) => {
                setActiveDateFilter(val);
                setPage(1);
              }}
              customStart={customStart}
              onCustomStartChange={(cs) => {
                setCustomStart(cs);
                setPage(1);
              }}
              customEnd={customEnd}
              onCustomEndChange={(ce) => {
                setCustomEnd(ce);
                setPage(1);
              }}
            />
          </div>"""

if old_overview_pills in content:
    content = content.replace(old_overview_pills, new_overview_pills, 1)
    print("2. Overview date filter updated to StandardDateFilter")
else:
    print("WARNING 2: old_overview_pills not found")

# 3. Update list view date pills (around line 1400)
old_list_pills = """            {/* Date filter pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all_time', label: 'All time' },
                { id: 'this_month', label: 'This month' },
                { id: 'last_7_days', label: 'Last 7 days' },
                { id: 'today', label: 'Today' }
              ].map((pill) => {
                const active = activeDateFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setActiveDateFilter(pill.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: active ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid transparent',
                      background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                      color: active ? '#0f172a' : '#64748b',
                      fontWeight: active ? 700 : 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>"""

new_list_pills = """            {/* Standardized Date Filter */}
            <StandardDateFilter
              value={activeDateFilter}
              onChange={(val) => {
                setActiveDateFilter(val);
                setPage(1);
              }}
              customStart={customStart}
              onCustomStartChange={(cs) => {
                setCustomStart(cs);
                setPage(1);
              }}
              customEnd={customEnd}
              onCustomEndChange={(ce) => {
                setCustomEnd(ce);
                setPage(1);
              }}
            />"""

if old_list_pills in content:
    content = content.replace(old_list_pills, new_list_pills, 1)
    print("3. List view date filter updated to StandardDateFilter")
else:
    print("WARNING 3: old_list_pills not found")

# 4. Update list view rows to support Table View and add DisplayPreferencesBar & StandardPagination
old_list_rows = """          {/* Vouchers List Rows (Matches Screenshot 3) */}
          <div
            className="glass-panel"
            style={{
              padding: 0,
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(var(--glass-blur, 24px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
              boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(15, 23, 42, 0.08))'
            }}
          >
            {paginatedRows.map((v, i) => {
              const vKey = getVKey(v);
              const isPinned = isVoucherPinned(v);
              const isDragging = draggedKey === vKey;
              const isDragOver = dragOverKey === vKey;

              return (
                <div
                  key={vKey}
                  className="vm-voucher-row"
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, v)}
                  onDragOver={(e) => handleDragOver(e, v)}
                  onDrop={(e) => handleDrop(e, v)}
                  onDragEnd={() => {
                    setDraggedKey(null);
                    setDragOverKey(null);
                    setTimeout(() => { wasDraggingRef.current = false; }, 200);
                  }}
                  onClick={() => {
                    if (wasDraggingRef.current) return;
                    openVoucherDetail(v);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuVoucher(v);
                  }}
                  {...createHoldTouchHandler(() => setMenuVoucher(v))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: i < paginatedRows.length - 1 ? '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))' : 'none',
                    cursor: 'pointer',
                    background: isPinned ? 'rgba(99, 102, 241, 0.06)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : 'transparent'),
                    opacity: isDragging ? 0.4 : 1,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--glass-hover, rgba(255, 255, 255, 0.35))'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = isPinned ? 'rgba(99, 102, 241, 0.06)' : 'transparent'; }}
                >
                  {/* Left: Squircle Receipt Icon + Party Name & Sub-details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid var(--glass-border, rgba(225, 29, 72, 0.12))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9f1239',
                        boxShadow: '0 2px 8px rgba(159, 18, 57, 0.06)',
                        flexShrink: 0
                      }}
                    >
                      <Receipt size={20} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4
                          className="vm-voucher-party"
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {v.party_name || '—'}
                        </h4>
                        {isPinned && (
                          <span className="item-pinned-tag" style={{ flexShrink: 0 }}>
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                      </div>

                      <p className="vm-voucher-sub" style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                        {v.reference_no ? `${v.reference_no} · ` : ''}
                        {formatDayMonth(v.voucher_date)} · {v.voucher_type || 'Voucher'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Options Menu Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="vm-voucher-amount" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {inr(v.amount)}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                        Synced
                      </div>
                    </div>

                    <button
                      type="button"
                      className="tile-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuVoucher(v);
                      }}
                      title="Voucher actions"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px'
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredList.length)} of {filteredList.length}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', fontWeight: 700 }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}"""

new_list_rows = """          {/* Vouchers Table / Card Display */}
          {displayMode === 'table' ? (
            <div className="table-responsive-container">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    {visibleColumns.includes('date') && <th>Date</th>}
                    {visibleColumns.includes('type') && <th>Type</th>}
                    {visibleColumns.includes('party') && <th>Party Name</th>}
                    {visibleColumns.includes('ref') && <th>Voucher # / Ref</th>}
                    {visibleColumns.includes('amount') && <th style={{ textAlign: 'right' }}>Amount</th>}
                    {visibleColumns.includes('status') && <th>Status</th>}
                    <th style={{ textAlign: 'center', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((v) => {
                    const vKey = getVKey(v);
                    const isPinned = isVoucherPinned(v);
                    return (
                      <tr
                        key={vKey}
                        onClick={() => openVoucherDetail(v)}
                        style={{ cursor: 'pointer', background: isPinned ? 'rgba(99, 102, 241, 0.05)' : undefined }}
                        title="Click to view voucher entries"
                      >
                        {visibleColumns.includes('date') && (
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{formatDayMonth(v.voucher_date)}</span>
                          </td>
                        )}
                        {visibleColumns.includes('type') && (
                          <td>
                            <span className="vtype-chip" style={{ color: 'var(--primary-color)', background: 'var(--primary-light)' }}>
                              {v.voucher_type || 'Voucher'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('party') && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{v.party_name || '—'}</span>
                              {isPinned && <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px' }}><Pin size={9} /> Pinned</span>}
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('ref') && (
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{v.reference_no || v.voucher_number || '—'}</span>
                          </td>
                        )}
                        {visibleColumns.includes('amount') && (
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {inr(v.amount)}
                          </td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td>
                            <span className="badge badge-success">Synced</span>
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => setMenuVoucher(v)}
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
            <div
              className="glass-panel"
              style={{
                padding: 0,
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(var(--glass-blur, 24px))',
                WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
                boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(15, 23, 42, 0.08))'
              }}
            >
              {paginatedRows.map((v, i) => {
                const vKey = getVKey(v);
                const isPinned = isVoucherPinned(v);
                const isDragging = draggedKey === vKey;
                const isDragOver = dragOverKey === vKey;

                return (
                  <div
                    key={vKey}
                    className="vm-voucher-row"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, v)}
                    onDragOver={(e) => handleDragOver(e, v)}
                    onDrop={(e) => handleDrop(e, v)}
                    onDragEnd={() => {
                      setDraggedKey(null);
                      setDragOverKey(null);
                      setTimeout(() => { wasDraggingRef.current = false; }, 200);
                    }}
                    onClick={() => {
                      if (wasDraggingRef.current) return;
                      openVoucherDetail(v);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuVoucher(v);
                    }}
                    {...createHoldTouchHandler(() => setMenuVoucher(v))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: i < paginatedRows.length - 1 ? '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))' : 'none',
                      cursor: 'pointer',
                      background: isPinned ? 'rgba(99, 102, 241, 0.06)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : 'transparent'),
                      opacity: isDragging ? 0.4 : 1,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid var(--glass-border, rgba(225, 29, 72, 0.12))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9f1239',
                          boxShadow: '0 2px 8px rgba(159, 18, 57, 0.06)',
                          flexShrink: 0
                        }}
                      >
                        <Receipt size={20} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4
                            className="vm-voucher-party"
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#0f172a',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {v.party_name || '—'}
                          </h4>
                          {isPinned && (
                            <span className="item-pinned-tag" style={{ flexShrink: 0 }}>
                              <Pin size={10} /> Pinned
                            </span>
                          )}
                        </div>

                        <p className="vm-voucher-sub" style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                          {v.reference_no ? `${v.reference_no} · ` : ''}
                          {formatDayMonth(v.voucher_date)} · {v.voucher_type || 'Voucher'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="vm-voucher-amount" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {inr(v.amount)}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                          Synced
                        </div>
                      </div>

                      <button
                        type="button"
                        className="tile-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuVoucher(v);
                        }}
                        title="Voucher actions"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '8px'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <DisplayPreferencesBar
              viewMode={displayMode}
              onViewModeChange={(m) => {
                setDisplayMode(m);
                try { localStorage.setItem('tc_pref_vm_mode', m); } catch {}
              }}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
                try { localStorage.setItem('tc_pref_vm_size', String(sz)); } catch {}
              }}
              columns={[
                { id: 'date', label: 'Date' },
                { id: 'type', label: 'Voucher Type' },
                { id: 'party', label: 'Party Name' },
                { id: 'ref', label: 'Voucher # / Ref' },
                { id: 'amount', label: 'Amount' },
                { id: 'status', label: 'Status' }
              ]}
              visibleColumns={visibleColumns}
              onColumnToggle={(colId) => {
                const next = visibleColumns.includes(colId) ? visibleColumns.filter(c => c !== colId) : [...visibleColumns, colId];
                setVisibleColumns(next);
                try { localStorage.setItem('tc_pref_vm_cols', JSON.stringify(next)); } catch {}
              }}
            />

            <StandardPagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={filteredList.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
                try { localStorage.setItem('tc_pref_vm_size', String(sz)); } catch {}
              }}
            />
          </div>"""

if old_list_rows in content:
    content = content.replace(old_list_rows, new_list_rows, 1)
    print("4. List view updated with Table View, DisplayPreferencesBar, and StandardPagination")
else:
    print("WARNING 4: old_list_rows not found")

with open(vm_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("VoucherManager.jsx update finished")

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Check, Loader2, Plus } from 'lucide-react';
import { api, getCompanySyncStatus } from './api';

const dedupeCompanies = (list) => {
  if (!Array.isArray(list)) return [];
  const map = new Map();
  for (const c of list) {
    if (c && c.company_guid && !map.has(c.company_guid)) {
      map.set(c.company_guid, c);
    }
  }
  return Array.from(map.values());
};

export default function CompanyDropdown({ companyGuid, setCompanyGuid, setCurrentTab }) {
  const [companies, setCompanies] = useState(() => {
    try {
      const cached = localStorage.getItem('tc_companies_cache');
      return cached ? dedupeCompanies(JSON.parse(cached)) : [];
    } catch {
      return [];
    }
  });
  const [selected, setSelected] = useState([]);
  const [syncStatusMap, setSyncStatusMap] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingGuid, setSwitchingGuid] = useState(null);
  const [loading, setLoading] = useState(() => !localStorage.getItem('tc_companies_cache'));
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const dropdownRef = useRef(null);
  const popRef = useRef(null);
  const triggerRef = useRef(null);
  const [popStyle, setPopStyle] = useState({});

  const fetchCompanies = async () => {
    if (!companies.length) setLoading(true);
    setLoadError(null);
    try {
      const [res, resSelected, resSync] = await Promise.all([
        api.get('/company').catch((e) => ({ __error: e })),
        api.get('/company/selected').catch(() => null),
        getCompanySyncStatus().catch(() => null),
      ]);
      if (res && res.__error) {
        if (!companies.length) {
          setLoadError(res.__error?.message || 'Failed to load companies');
          setCompanies([]);
        }
      } else if (res && res.success) {
        const unique = dedupeCompanies(res.data || []);
        setCompanies(unique);
        try {
          localStorage.setItem('tc_companies_cache', JSON.stringify(unique));
        } catch {}
        if (!companyGuid && unique.length > 0) {
          const auto = unique[0].company_guid;
          setCompanyGuid(auto);
          try { localStorage.setItem('tc_active_company', auto); } catch {}
        }
      }
      if (resSelected && resSelected.success) {
        setSelected((resSelected.data || []).map((c) => c.company_guid));
      }
      if (resSync && resSync.success && Array.isArray(resSync.companies)) {
        const m = {};
        for (const sc of resSync.companies) {
          m[sc.company_guid] = sc;
        }
        setSyncStatusMap(m);
      }
    } catch {
      if (!companies.length) setLoadError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        popRef.current && !popRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (guid) => {
    if (!guid) return;
    setError(null);
    setWarning(null);

    // Already active → nothing to do.
    if (guid === companyGuid) {
      setIsOpen(false);
      return;
    }
    if (isSwitching) return;

    // Optimistic label: show the target while the request is in flight, but do
    // NOT commit the app's active company until the backend confirms it.
    setIsOpen(false);
    setIsSwitching(true);
    setSwitchingGuid(guid);

    let selectWarning = null;
    try {
      // Best-effort: register the company against the plan's company-limit.
      // This must never block the switch — `/company/set-active` (below) is the
      // call that actually changes the active company and the backend allows it
      // independently of the plan selection.
      if (!selected.includes(guid)) {
        try {
          await api.post('/company/select', { company_guid: guid });
          setSelected((prev) => (prev.includes(guid) ? prev : [...prev, guid]));
        } catch (selErr) {
          selectWarning = selErr?.message || 'Could not register the company with your plan.';
        }
      }

      const res = await api.post('/company/set-active', { company_guid: guid });
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to switch company');
      }
      const next = (res && res.company_guid) || guid;

      // Success: persist and switch the app's active company.
      try {
        localStorage.setItem('tc_active_company', next);
        localStorage.removeItem('tc_cash_' + next);
      } catch {}
      api.invalidate('/'); // drop any cached reads from the previous company
      setCompanyGuid(next);

      if (selectWarning) {
        console.warn('Company switch: selection not recorded —', selectWarning);
        setWarning(`Switched, but the plan selection could not be recorded: ${selectWarning}`);
        setIsOpen(true);
      }
    } catch (err) {
      // Failure: keep the previous company active and surface the reason.
      setError(err?.message || 'Failed to switch company');
      setIsOpen(true);
    } finally {
      setIsSwitching(false);
      setSwitchingGuid(null);
    }
  };

  const uniqueCompanies = dedupeCompanies(companies);
  const displayGuid = switchingGuid || companyGuid;
  const activeCompany = uniqueCompanies.find(c => c.company_guid === displayGuid);

  const openPop = () => {
    const t = triggerRef.current;
    if (t && typeof window !== 'undefined') {
      const r = t.getBoundingClientRect();
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      if (mobile) {
        // Bottom sheet on phones — positioned by the ≤768px CSS block.
        setPopStyle({});
      } else {
        const width = Math.min(280, window.innerWidth - 24);
        const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
        setPopStyle({ position: 'fixed', top: `${r.bottom + 8}px`, left: `${left}px` });
      }
    }
    setIsOpen(true);
  };

  return (
    <div ref={dropdownRef} className="company-dropdown">
      <button
        type="button"
        ref={triggerRef}
        className="company-trigger"
        onClick={openPop}
        title="Select Company"
      >
        <span className="company-icon">
          {isSwitching ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <Building2 size={13} />
          )}
        </span>
        <span className="company-trigger-name">
          {isSwitching
            ? (activeCompany ? activeCompany.name : 'Switching...')
            : (activeCompany ? activeCompany.name : (loading ? 'Loading...' : 'Select Company'))}
        </span>
        <ChevronDown size={14} className={`company-chev ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div className="company-pop" ref={popRef} style={popStyle}>
          <div className="company-pop-head">Switch company</div>
          {error && (
            <div className="company-pop-msg company-pop-error">{error}</div>
          )}
          {warning && (
            <div className="company-pop-msg company-pop-warn">{warning}</div>
          )}

          {loading ? (
            <div className="company-pop-empty">Loading companies…</div>
          ) : loadError ? (
            <div className="company-pop-empty">
              <div style={{ color: 'var(--danger)', marginBottom: '8px', fontWeight: 600 }}>{loadError}</div>
              <button className="btn-secondary" onClick={fetchCompanies}>Retry</button>
            </div>
          ) : uniqueCompanies.length === 0 ? (
            <div className="company-pop-empty">No companies available</div>
          ) : (
            <div className="company-pop-list">
              {uniqueCompanies.map(c => {
                const isCurrent = c.company_guid === companyGuid;
                const syncInfo = syncStatusMap[c.company_guid];
                return (
                  <button
                    type="button"
                    key={c.company_guid}
                    className={`company-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelect(c.company_guid)}
                  >
                    <span className="company-item-icon"><Building2 size={15} /></span>
                    <span className="company-item-name">{c.name}</span>

                    {/* Sync State Badge */}
                    {syncInfo && syncInfo.state && (
                      <span style={{
                        fontSize: '10.5px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        marginLeft: 'auto',
                        marginRight: isCurrent ? '6px' : '0',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        background: syncInfo.state === 'syncing' ? 'rgba(59, 130, 246, 0.12)'
                          : syncInfo.state === 'synced' ? 'rgba(16, 185, 129, 0.12)'
                          : syncInfo.state === 'stalled' ? 'rgba(245, 158, 11, 0.12)'
                          : syncInfo.state === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0,0,0,0.05)',
                        color: syncInfo.state === 'syncing' ? '#2563eb'
                          : syncInfo.state === 'synced' ? '#059669'
                          : syncInfo.state === 'stalled' ? '#d97706'
                          : syncInfo.state === 'error' ? '#dc2626' : '#64748b'
                      }}>
                        {syncInfo.state === 'syncing' && syncInfo.percent != null ? `${syncInfo.percent}%` : syncInfo.state}
                      </span>
                    )}

                    {isCurrent && (
                      <span className="company-item-active"><Check size={13} /> Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !loadError && uniqueCompanies.length === 1 && (
            <div className="company-pop-hint">
              Only one company is linked to this account. Add another company to switch between them.
            </div>
          )}

          <div className="company-pop-sep" />
          <button
            type="button"
            className="company-pop-manage"
            onClick={() => {
              setIsOpen(false);
              if (setCurrentTab) setCurrentTab('companies');
            }}
          >
            <Plus size={15} /> Add / Manage Companies
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

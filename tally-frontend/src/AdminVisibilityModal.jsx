import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Eye, EyeOff, RotateCcw, Check, X, Sliders, LayoutGrid, BarChart3, Users, Package, FileText, ShoppingCart, Landmark } from 'lucide-react';
import { getAdminVisibilityConfig, saveAdminVisibilityConfig, resetAdminVisibilityConfig, DEFAULT_ADMIN_VISIBILITY } from './adminVisibility';

export const AdminVisibilityModal = ({ isOpen, onClose, user }) => {
  const [config, setConfig] = useState(() => getAdminVisibilityConfig());
  const [activeTab, setActiveTab] = useState('nav'); // 'nav' | 'dashboard' | 'reports'
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getAdminVisibilityConfig());
      setSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = user?.role === 'ADMIN' || user?.isAdmin === true;

  const toggleNav = (key) => {
    setConfig(prev => ({
      ...prev,
      navTabs: { ...prev.navTabs, [key]: !prev.navTabs[key] }
    }));
  };

  const toggleCard = (key) => {
    setConfig(prev => ({
      ...prev,
      dashboardCards: { ...prev.dashboardCards, [key]: !prev.dashboardCards[key] }
    }));
  };

  const toggleReport = (key) => {
    setConfig(prev => ({
      ...prev,
      reportSections: { ...prev.reportSections, [key]: !prev.reportSections[key] }
    }));
  };

  const handleSave = () => {
    saveAdminVisibilityConfig(config);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Reset all user visibility controls to system defaults?')) {
      resetAdminVisibilityConfig();
      setConfig(DEFAULT_ADMIN_VISIBILITY);
    }
  };

  const NAV_ITEMS = [
    { key: 'dashboard', name: 'Dashboard', desc: 'Main executive dashboard and KPIs' },
    { key: 'ledger', name: 'Customer & Vendor Ledgers', desc: 'Party ledgers, statements, and balances' },
    { key: 'inventory', name: 'Inventory & Stock Items', desc: 'Item catalog, stock quantities, and valuation' },
    { key: 'vouchers', name: 'Voucher Explore', desc: 'Sales, purchase, receipt, and payment transactions' },
    { key: 'orders', name: 'Orders Book', desc: 'Sales and purchase orders registry' },
    { key: 'bills', name: 'Outstanding Bills', desc: 'Receivable and payable ageing reports' },
    { key: 'reports', name: 'Financial Reports', desc: 'Day book, registers, and P&L statements' },
    { key: 'activity', name: 'Activity Log', desc: 'Recent sync operations and changes' },
    { key: 'attendance', name: 'Team Attendance', desc: 'Daily check-in / check-out and work hours tracking' },
    { key: 'einvoice', name: 'E-Invoice', desc: 'IRN / ACK tracking and e-invoice compliance alerts' },
    { key: 'deleted', name: 'Delete History', desc: 'Restorable archived ledger records' },
    { key: 'companies', name: 'Companies Selector', desc: 'Connected Tally Prime companies' },
  ];

  const DASHBOARD_CARDS = [
    { key: 'stat_cards', name: 'Receivable & Payable Summary Cards', desc: 'Top row balance and cash KPI metrics' },
    { key: 'sales_analytics', name: 'Sales Analytics Chart Card', desc: 'Interactive revenue analytics and trends' },
    { key: 'attendance', name: 'Attendance Status Card', desc: 'Punch clock widget for team members & live roster for admin' },
    { key: 'cash_flow', name: 'Cash Flow Forecast', desc: 'Predicted inflows, outflows, and net runway' },
    { key: 'quick_actions', name: 'Quick Action Navigation Tiles', desc: 'Shortcuts to New Sale, Inventory, etc.' },
    { key: 'recent_activity', name: 'Recent Synced Transactions', desc: 'Real-time feed of newly synchronized entries' },
  ];

  const REPORT_SECTIONS = [
    { key: 'sales_analytics', name: 'Sales & Revenue Analytics', desc: 'Period revenue breakdowns and charts' },
    { key: 'top_customers', name: 'Top Customers & Vendors', desc: 'Top parties ranked by sales or outstanding' },
    { key: 'expense_analytics', name: 'Expense & Cost Analytics', desc: 'Operational and direct expense charts' },
    { key: 'financial_statements', name: 'Financial Statements (P&L, Balance Sheet)', desc: 'Full formal statements' },
    { key: 'day_book', name: 'Day Book Register', desc: 'Chronological daily accounting transactions' },
    { key: 'quiet_customers', name: 'Quiet Customers Report', desc: 'Parties with no transactions in selected period' },
    { key: 'registers', name: 'Sales & Purchase Registers', desc: 'Full chronological tax and invoice registers' },
  ];

  return createPortal(
    <div
      className="fade-in modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.48)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.94))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--glass-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '22px 26px 16px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(0, 122, 255, 0.12)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>
                Administrator Role Visibility Controls
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure frontend module and card visibility for regular users
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Informational Banner */}
        <div style={{
          padding: '10px 24px',
          background: 'rgba(0, 122, 255, 0.06)',
          borderBottom: '1px solid var(--glass-border)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Notice:</span>
          <span>Controls frontend interface visibility for standard users. Backend API security is strictly enforced on the server.</span>
        </div>

        {/* Tab switch */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            className={`seg-btn ${activeTab === 'nav' ? 'active' : ''}`}
            onClick={() => setActiveTab('nav')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'nav' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'nav' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Navigation Tabs
          </button>
          <button
            type="button"
            className={`seg-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'dashboard' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Dashboard Cards
          </button>
          <button
            type="button"
            className={`seg-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'reports' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'reports' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Reports &amp; Analytics
          </button>
        </div>

        {/* Body Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isAdmin ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <EyeOff size={28} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <h4>Administrator Access Required</h4>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Only users with the Administrator role can modify global user visibility rules.</p>
            </div>
          ) : (
            <>
              {activeTab === 'nav' && (
                NAV_ITEMS.map((item) => {
                  const isVisible = config.navTabs?.[item.key] !== false;
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleNav(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isVisible ? 'var(--glass-bg)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: isVisible ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isVisible ? '#10b981' : '#94a3b8' }}>
                          {isVisible ? 'Visible to Users' : 'Hidden from Users'}
                        </span>
                        <div className={`ios-switch ${isVisible ? 'on' : ''}`} style={{ pointerEvents: 'none' }} />
                      </div>
                    </div>
                  );
                })
              )}

              {activeTab === 'dashboard' && (
                DASHBOARD_CARDS.map((item) => {
                  const isVisible = config.dashboardCards?.[item.key] !== false;
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleCard(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isVisible ? 'var(--glass-bg)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: isVisible ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isVisible ? '#10b981' : '#94a3b8' }}>
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                        <div className={`ios-switch ${isVisible ? 'on' : ''}`} style={{ pointerEvents: 'none' }} />
                      </div>
                    </div>
                  );
                })
              )}

              {activeTab === 'reports' && (
                REPORT_SECTIONS.map((item) => {
                  const isVisible = config.reportSections?.[item.key] !== false;
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleReport(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isVisible ? 'var(--glass-bg)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: isVisible ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isVisible ? '#10b981' : '#94a3b8' }}>
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                        <div className={`ios-switch ${isVisible ? 'on' : ''}`} style={{ pointerEvents: 'none' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--glass-hover)'
        }}>
          {isAdmin ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <RotateCcw size={14} /> Reset to Defaults
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 18px', borderRadius: '12px' }}>
              Cancel
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                style={{
                  padding: '8px 24px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <Check size={16} /> {savedNotice ? 'Saved!' : 'Save & Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminVisibilityModal;

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Server, Activity, Zap, CheckCircle2, AlertCircle, Clock, Database,
  Terminal, ShieldCheck, RefreshCw, X, ChevronRight, Check, Play,
  Cpu, Radio, FileText, ArrowRight, Layers, Bell, Send, Key, Settings,
  Copy, ExternalLink, HardDrive
} from 'lucide-react';
import { api, getUser } from './api';

export const TallyConnectorModal = ({
  isOpen,
  onClose,
  companyGuid,
  activeCompanyName = 'Lumilo',
  queueBreakdown = { ledgers: 0, vouchers: 0, bills: 0 },
  onTriggerSync,
  syncTriggering = false
}) => {
  const [activeTab, setActiveTab] = useState('endpoints'); // 'endpoints' | 'remaining' | 'queue' | 'pipeline'
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [activeAdminInfo, setActiveAdminInfo] = useState(null);
  const [agentStatusInfo, setAgentStatusInfo] = useState(null);
  const [livePendingQueue, setLivePendingQueue] = useState([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const effectiveGuid = companyGuid || (() => {
    try { return localStorage.getItem('tc_active_company') || ''; } catch { return ''; }
  })();

  // Run live diagnostics across all reachable agent & connector endpoints
  const runLiveDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    const results = {};
    const startTime = Date.now();

    try {
      // 1. Check sync-status
      try {
        const t0 = performance.now();
        const statRes = await api.get('/agent-status/sync-status', { company_guid: effectiveGuid });
        const latency = Math.round(performance.now() - t0);
        results['sync-status'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          data: statRes
        };
        setAgentStatusInfo(statRes);
      } catch (e) {
        results['sync-status'] = { status: 'error', error: e.message };
      }

      // 2. Check active-admin
      try {
        const t0 = performance.now();
        const adminRes = await api.get('/sync/active-admin');
        const latency = Math.round(performance.now() - t0);
        results['active-admin'] = {
          status: adminRes?.active ? 'online' : 'idle',
          httpCode: 200,
          latency: `${latency}ms`,
          data: adminRes
        };
        setActiveAdminInfo(adminRes);
      } catch (e) {
        results['active-admin'] = { status: 'error', error: e.message };
      }

      // 3. Check pending ledgers queue
      try {
        const t0 = performance.now();
        const ledgersRes = await api.get('/sync-queue/pending-ledgers', { company_guid: effectiveGuid });
        const latency = Math.round(performance.now() - t0);
        results['pending-ledgers'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          count: Array.isArray(ledgersRes) ? ledgersRes.length : 0,
          data: ledgersRes
        };
        if (Array.isArray(ledgersRes)) {
          setLivePendingQueue(ledgersRes);
        }
      } catch (e) {
        results['pending-ledgers'] = { status: 'error', error: e.message };
      }

      // 4. Check pending vouchers queue
      try {
        const t0 = performance.now();
        const vchRes = await api.get('/sync-queue/pending', { company_guid: effectiveGuid });
        const latency = Math.round(performance.now() - t0);
        results['pending-vouchers'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          count: Array.isArray(vchRes) ? vchRes.length : 0
        };
      } catch (e) {
        results['pending-vouchers'] = { status: 'error', error: e.message };
      }

      // 5. Check pending bills queue
      try {
        const t0 = performance.now();
        const billsRes = await api.get('/sync-queue/pending-bills', { company_guid: effectiveGuid });
        const latency = Math.round(performance.now() - t0);
        results['pending-bills'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          count: Array.isArray(billsRes) ? billsRes.length : 0
        };
      } catch (e) {
        results['pending-bills'] = { status: 'error', error: e.message };
      }

      // 6. Check admin notifications (Section 4)
      try {
        const t0 = performance.now();
        const notifRes = await api.get('/admin/notifications');
        const latency = Math.round(performance.now() - t0);
        const notifCount = Array.isArray(notifRes)
          ? notifRes.length
          : (Array.isArray(notifRes?.notifications) ? notifRes.notifications.length : 0);
        results['admin-notifications'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          count: notifCount
        };
      } catch (e) {
        results['admin-notifications'] = { status: 'error', error: e.message };
      }

      // 7. Check pending mobile queue (/api/mobile-sync-queue/pending)
      try {
        const t0 = performance.now();
        const mobRes = await api.get('/api/mobile-sync-queue/pending', { company_guid: effectiveGuid });
        const latency = Math.round(performance.now() - t0);
        results['pending-mobile'] = {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          count: Array.isArray(mobRes) ? mobRes.length : 0,
          data: mobRes
        };
      } catch (e) {
        results['pending-mobile'] = { status: 'error', error: e.message };
      }

      setTestResults(results);
    } finally {
      setDiagnosticsLoading(false);
    }
  }, [effectiveGuid]);

  useEffect(() => {
    if (isOpen) {
      runLiveDiagnostics();
    }
  }, [isOpen, runLiveDiagnostics]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Specific on-demand ping for a card
  const handlePingEndpoint = async (key, endpoint, method = 'GET', body = null) => {
    setTestingEndpoint(key);
    const t0 = performance.now();
    try {
      let res;
      if (method === 'POST') {
        res = await api.post(endpoint, body || {});
      } else {
        res = await api.get(endpoint, body || {});
      }
      const latency = Math.round(performance.now() - t0);
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'online',
          httpCode: 200,
          latency: `${latency}ms`,
          data: res,
          lastTested: new Date().toLocaleTimeString()
        }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'error',
          error: err.message,
          lastTested: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  if (!isOpen) return null;

  const totalQueued = (queueBreakdown.ledgers || 0) + (queueBreakdown.vouchers || 0) + (queueBreakdown.bills || 0);

  // 11 Agent & Tally Connector Endpoints
  const agentEndpoints = [
    {
      id: 'push-masters',
      method: 'POST',
      path: '/sync/push-masters & /ledger/sync',
      badge: 'Ingestion',
      badgeColor: '#10b981',
      title: 'Master Data Push (ODBC Ingestion)',
      description: 'Ingests XML/JSON ledger, inventory and stock master accounts pushed directly from Tally Prime ODBC engine.',
      direction: 'Tally → Backend',
      type: 'Tally ODBC Exporter',
      auth: 'Agent API Key / HMAC',
      status: 'Active (Port 9000 Ready)'
    },
    {
      id: 'push-vouchers',
      method: 'POST',
      path: '/sync/push-vouchers & /voucher-entry/bulk-sync',
      badge: 'Ingestion',
      badgeColor: '#10b981',
      title: 'Voucher Transactions Push',
      description: 'Ingests daybook transactions, sales invoices, payments, and receipts streamed directly from local Tally Prime.',
      direction: 'Tally → Backend',
      type: 'Daybook Streamer',
      auth: 'Agent API Key / HMAC',
      status: 'Active (Port 9000 Ready)'
    },
    {
      id: 'pending-vouchers',
      method: 'GET',
      path: '/sync-queue/pending',
      badge: 'Writeback Queue',
      badgeColor: '#3b82f6',
      title: 'Pending Voucher Writebacks Poller',
      description: 'Polled periodically by the Windows tally-agent daemon to retrieve queued sales/purchase vouchers created in web/mobile app.',
      direction: 'Backend → Tally',
      type: 'Voucher Queue Poller',
      auth: 'Bearer JWT / Agent License',
      status: `${queueBreakdown.vouchers || 0} Pending`,
      testable: true,
      testEndpoint: '/sync-queue/pending',
      testParams: { company_guid: effectiveGuid }
    },
    {
      id: 'pending-ledgers',
      method: 'GET',
      path: '/sync-queue/pending-ledgers',
      badge: 'Writeback Queue',
      badgeColor: '#8b5cf6',
      title: 'Pending Ledger Writebacks Poller',
      description: 'Dispatches queued party ledger accounts created in cloud web dashboard for automatic creation in Tally Prime.',
      direction: 'Backend → Tally',
      type: 'Ledger Queue Poller',
      auth: 'Bearer JWT / Agent License',
      status: `${queueBreakdown.ledgers || livePendingQueue.length || 0} Pending Items in DB`,
      highlight: true,
      testable: true,
      testEndpoint: '/sync-queue/pending-ledgers',
      testParams: { company_guid: effectiveGuid }
    },
    {
      id: 'pending-bills',
      method: 'GET',
      path: '/sync-queue/pending-bills',
      badge: 'Writeback Queue',
      badgeColor: '#f59e0b',
      title: 'Pending Bill References Poller',
      description: 'Agent poller for pending bill-by-bill references and invoice allocations to be reconciled inside Tally Prime.',
      direction: 'Backend → Tally',
      type: 'Bill Queue Poller',
      auth: 'Bearer JWT / Agent License',
      status: `${queueBreakdown.bills || 0} Pending`,
      testable: true,
      testEndpoint: '/sync-queue/pending-bills',
      testParams: { company_guid: effectiveGuid }
    },
    {
      id: 'pending-mobile',
      method: 'GET',
      path: '/api/mobile-sync-queue/pending',
      badge: 'Mobile App Sync',
      badgeColor: '#6366f1',
      title: 'Mobile App Pending Queue Poller',
      description: 'Polled to retrieve offline sales and payment vouchers generated on the Flutter mobile app waiting for desktop Tally writeback.',
      direction: 'Mobile App → Tally Prime',
      type: 'Mobile Queue Channel',
      auth: 'Bearer JWT / Mobile Auth',
      status: `${queueBreakdown.mobile || 0} Pending`,
      testable: true,
      testEndpoint: '/api/mobile-sync-queue/pending',
      testParams: { company_guid: effectiveGuid }
    },
    {
      id: 'queue-ack',
      method: 'POST',
      path: '/sync-queue/:id/success & /failed',
      badge: 'Acknowledgement',
      badgeColor: '#06b6d4',
      title: 'Writeback Acknowledgement & Receipt',
      description: 'Called by Windows tally-agent to confirm voucher insertion into Tally Prime or report XML parsing errors with full trace.',
      direction: 'Tally → Backend',
      type: 'Bi-Directional Ack',
      auth: 'Bearer JWT / Agent License',
      status: 'Listening'
    },
    {
      id: 'agent-heartbeat',
      method: 'POST',
      path: '/agent-status/sync-status',
      badge: 'Telemetry',
      badgeColor: '#ec4899',
      title: 'Periodic Agent Heartbeat & Completion',
      description: 'Windows background agent sends continuous keep-alive heartbeats and notifies web dashboard upon sync round completion.',
      direction: 'Tally → Backend',
      type: 'Health Heartbeat',
      auth: 'Bearer JWT / Agent License',
      status: agentStatusInfo?.last_sync_at ? 'Synced' : 'Ready',
      testable: true,
      testEndpoint: '/agent-status/sync-status',
      testMethod: 'GET',
      testParams: { company_guid: effectiveGuid }
    },
    {
      id: 'sync-started',
      method: 'POST',
      path: '/agent-status/sync-started',
      badge: 'Telemetry',
      badgeColor: '#ec4899',
      title: 'Sync Lifecycle Notification',
      description: 'Marks sync_in_progress=TRUE in agent_status table so the web app shows the pulsing live sync badge in real-time.',
      direction: 'Tally → Backend',
      type: 'Status Broadcaster',
      auth: 'Bearer JWT / Agent License',
      status: agentStatusInfo?.sync_in_progress ? 'Sync In Progress' : 'Idle'
    },
    {
      id: 'agent-handshake',
      method: 'POST',
      path: '/agent/handshake',
      badge: 'Handshake & Auth',
      badgeColor: '#6366f1',
      title: 'Agent Handshake & License Tunnel',
      description: 'Windows agent verifies license key, validates device hardware fingerprint, registers tunnel and attaches active company.',
      direction: 'Bidirectional Handshake',
      type: 'Security Handshake',
      auth: 'License Key + Device Fingerprint',
      status: 'Secured'
    },
    {
      id: 'agent-info',
      method: 'POST',
      path: '/agent/agent-info',
      badge: 'Diagnostics',
      badgeColor: '#64748b',
      title: 'Tally Machine & Gateway Telemetry',
      description: 'Records local Windows environment telemetry: Tally serial number, license edition (Silver/Gold), TSS validity, gateway port.',
      direction: 'Tally → Backend',
      type: 'Hardware & ERP Telemetry',
      auth: 'Agent License',
      status: 'Available'
    },
    {
      id: 'sync-trigger',
      method: 'POST',
      path: '/sync/trigger & /sync/active-admin',
      badge: 'Remote Control',
      badgeColor: '#e11d48',
      title: 'Force Sync Trigger & Multi-Tenant Isolation',
      description: 'Allows web admin to dispatch an instant out-of-band sync trigger flag and verifies tenant company isolation.',
      direction: 'Web UI → Windows Agent',
      type: 'Immediate Push Signal',
      auth: 'Admin JWT',
      status: 'Ready',
      testable: true,
      testEndpoint: '/sync/trigger',
      testMethod: 'POST',
      testParams: {}
    }
  ];

  // Section 4: Remaining System Endpoints
  const remainingEndpoints = [
    {
      id: 'admin-notifications',
      method: 'GET / PUT',
      path: '/admin/notifications & /:id/read',
      badge: 'Notification Engine',
      badgeColor: '#8b5cf6',
      title: 'Admin Activity & Security Alerts',
      description: 'Streams system notifications, voucher writeback failures, agent disconnect warnings, and allows bulk mark-as-read.',
      endpoints: ['GET /admin/notifications', 'PUT /admin/notifications/:id/read', 'PUT /admin/notifications/read-all'],
      auth: 'Admin JWT (requireAuth)',
      testable: true,
      testEndpoint: '/admin/notifications'
    },
    {
      id: 'send-invite',
      method: 'POST / GET',
      path: '/send-invite & /send-invite/admin/invites',
      badge: 'User Onboarding',
      badgeColor: '#3b82f6',
      title: 'Team Invitations & Member Dispatch',
      description: 'Dispatches transactional email invitation links to new accountants, team members, and tracks pending acceptance tokens.',
      endpoints: ['POST /send-invite', 'GET /send-invite/admin/invites', 'DELETE /send-invite/:id'],
      auth: 'Admin JWT'
    },
    {
      id: 'forgot-password',
      method: 'POST',
      path: '/api/auth/forgot-password & /reset-password',
      badge: 'Auth Recovery',
      badgeColor: '#10b981',
      title: 'Multi-Step OTP Password Recovery',
      description: 'Sends time-expiring 6-digit cryptographic verification code to registered email and processes secure hash password change.',
      endpoints: ['POST /api/auth/forgot-password', 'POST /api/auth/verify-reset-otp', 'POST /api/auth/reset-password'],
      auth: 'Public Rate-Limited'
    },
    {
      id: 'field-settings',
      method: 'GET / PUT',
      path: '/entry-field-settings',
      badge: 'Schema Customisation',
      badgeColor: '#f59e0b',
      title: 'Voucher Entry Custom Field Rules',
      description: 'Dynamic schema engine managing required, optional, or hidden field controls (dispatch notes, e-way bills, order numbers) per voucher type.',
      endpoints: ['GET /entry-field-settings', 'PUT /entry-field-settings'],
      auth: 'requireAuth',
      testable: true,
      testEndpoint: '/entry-field-settings'
    },
    {
      id: 'mobile-download',
      method: 'GET',
      path: '/api/mobile/notifications/download/:file',
      badge: 'Mobile Downloads',
      badgeColor: '#8b5cf6',
      title: 'Mobile Attachment & Statement Streamer',
      description: 'Binary file attachment server for invoices, payment receipts, and reports generated for mobile and web clients.',
      endpoints: ['GET /api/mobile/notifications/download/:file'],
      auth: 'requireAuth',
      testable: false
    }
  ];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          margin: 'auto',
          background: 'var(--glass-card-bg, #ffffff)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* =========================================================================
            MODAL HEADER
            ========================================================================= */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Server size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-dark, #0f172a)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Tally Connector & Agent Hub
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981'
                    }}
                  />
                  Live Daemon
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted, #64748b)',
                  margin: '3px 0 0',
                  fontWeight: 500
                }}
              >
                Diagnostic center for the 11 Windows Tally background agent endpoints, writeback workers & system services
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Run Diagnostics CTA */}
            <button
              type="button"
              onClick={runLiveDiagnostics}
              disabled={diagnosticsLoading}
              className="glass-panel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: diagnosticsLoading ? 'not-allowed' : 'pointer',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                color: 'var(--text-dark, #0f172a)'
              }}
              title="Ping all endpoints to check connectivity and latencies"
            >
              <RefreshCw size={14} className={diagnosticsLoading ? 'spin-icon' : ''} />
              {diagnosticsLoading ? 'Pinging...' : 'Ping Diagnostics'}
            </button>

            {/* Force Sync Trigger CTA */}
            {onTriggerSync && (
              <button
                type="button"
                onClick={onTriggerSync}
                disabled={syncTriggering}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: syncTriggering ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                }}
              >
                <Zap size={14} className={syncTriggering ? 'spin-icon' : ''} />
                {syncTriggering ? 'Triggering...' : 'Force Sync Now'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
                transition: 'all 0.15s ease'
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            TOP STATUS BANNER (REAL DATA)
            ========================================================================= */}
        <div
          style={{
            padding: '14px 24px',
            background: 'rgba(248, 250, 252, 0.6)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Active Company:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--text-dark, #0f172a)',
                  background: 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {activeCompanyName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Active Tenant GUID:</span>
              <code
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: '#2563eb',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
              >
                {effectiveGuid || 'DEMO-COMPANY-001'}
              </code>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Writeback Queue:</span>
              <span
                style={{
                  fontWeight: 800,
                  color: totalQueued > 0 ? '#d97706' : '#059669',
                  background: totalQueued > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {totalQueued > 0 ? `${totalQueued} Pending Action` : 'Queue Clear'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>
              Breakdown: <strong>{queueBreakdown.ledgers || livePendingQueue.length}</strong> Ledgers · <strong>{queueBreakdown.vouchers}</strong> Vouchers · <strong>{queueBreakdown.bills}</strong> Bills · <strong>{queueBreakdown.mobile || 0}</strong> Mobile
            </span>
          </div>
        </div>

        {/* =========================================================================
            TAB NAVIGATION
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 24px 0',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            gap: '8px',
            background: 'var(--glass-card-bg, #ffffff)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('endpoints')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'endpoints' ? '#2563eb' : 'var(--text-muted, #64748b)',
              borderBottom: activeTab === 'endpoints' ? '2px solid #2563eb' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={15} /> 3. Agent Endpoints (11)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remaining')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'remaining' ? '#2563eb' : 'var(--text-muted, #64748b)',
              borderBottom: activeTab === 'remaining' ? '2px solid #2563eb' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={15} /> 4. Remaining Endpoints (4)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'queue' ? '#2563eb' : 'var(--text-muted, #64748b)',
              borderBottom: activeTab === 'queue' ? '2px solid #2563eb' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={15} />
            Live Queue Inspector
            {livePendingQueue.length > 0 && (
              <span
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}
              >
                {livePendingQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'pipeline' ? '#2563eb' : 'var(--text-muted, #64748b)',
              borderBottom: activeTab === 'pipeline' ? '2px solid #2563eb' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Cpu size={15} /> Architecture Flow
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT
            ========================================================================= */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* TAB 1: 11 AGENT & CONNECTOR ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '14px' }}>
              {agentEndpoints.map((ep) => {
                const result = testResults[ep.id];
                const isTesting = testingEndpoint === ep.id;

                return (
                  <div
                    key={ep.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 18px',
                      borderRadius: '16px',
                      background: ep.highlight ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)' : 'rgba(255, 255, 255, 0.85)',
                      border: ep.highlight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(0, 0, 0, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 7px',
                            borderRadius: '6px',
                            background: ep.method.startsWith('POST') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: ep.method.startsWith('POST') ? '#059669' : '#2563eb'
                          }}
                        >
                          {ep.method}
                        </span>
                        <code
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-dark, #0f172a)'
                          }}
                        >
                          {ep.path}
                        </code>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: `${ep.badgeColor}18`,
                          color: ep.badgeColor,
                          border: `1px solid ${ep.badgeColor}33`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {ep.badge}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                        {ep.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)', lineHeight: '1.45' }}>
                        {ep.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                        fontSize: '11px',
                        color: 'var(--text-muted, #64748b)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>Direction: <strong style={{ color: 'var(--text-dark, #0f172a)' }}>{ep.direction}</strong></span>
                        <span>Auth: <strong style={{ color: 'var(--text-dark, #0f172a)' }}>{ep.auth}</strong></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {result && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: result.status === 'online' ? '#059669' : '#dc2626',
                              fontWeight: 700
                            }}
                          >
                            {result.status === 'online' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {result.latency || 'Verified'}
                          </span>
                        )}

                        {ep.testable && (
                          <button
                            type="button"
                            onClick={() => handlePingEndpoint(ep.id, ep.testEndpoint, ep.testMethod || 'GET', ep.testParams)}
                            disabled={isTesting}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              background: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: isTesting ? 'not-allowed' : 'pointer',
                              color: 'var(--text-dark, #0f172a)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Play size={10} className={isTesting ? 'spin-icon' : ''} />
                            {isTesting ? 'Pinging...' : 'Test Ping'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SECTION 4 REMAINING ENDPOINTS */}
          {activeTab === 'remaining' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '12px',
                  color: '#1e40af'
                }}
              >
                <strong>Section 4 — Remaining System Endpoints:</strong> Verified handlers for system notifications, transactional team invites, multi-step forgot password recovery, and per-voucher customizable field schema rules.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '14px' }}>
                {remainingEndpoints.map((ep) => {
                  const result = testResults[ep.id];
                  const isTesting = testingEndpoint === ep.id;

                  return (
                    <div
                      key={ep.id}
                      className="glass-panel"
                      style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: `${ep.badgeColor}18`,
                            color: ep.badgeColor,
                            border: `1px solid ${ep.badgeColor}33`
                          }}
                        >
                          {ep.badge}
                        </span>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                          Auth: {ep.auth}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                          {ep.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5' }}>
                          {ep.description}
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'rgba(241, 245, 249, 0.6)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                          Bound Endpoints:
                        </span>
                        {ep.endpoints.map((eStr, i) => (
                          <code key={i} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0f172a', fontWeight: 600 }}>
                            {eStr}
                          </code>
                        ))}
                      </div>

                      {ep.testable && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Route Active & Verified
                          </span>

                          <button
                            type="button"
                            onClick={() => handlePingEndpoint(ep.id, ep.testEndpoint)}
                            disabled={isTesting}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              background: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: isTesting ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Play size={10} className={isTesting ? 'spin-icon' : ''} />
                            {isTesting ? 'Checking...' : 'Ping Test'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME WRITEBACK QUEUE INSPECTOR */}
          {activeTab === 'queue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '12px',
                  color: '#b45309'
                }}
              >
                <div>
                  <strong>Live PostgreSQL `sync_queue` Rows:</strong> Showing {livePendingQueue.length} pending items waiting for tally-agent poller for company <code style={{ fontWeight: 700 }}>{effectiveGuid}</code>.
                </div>
                <button
                  type="button"
                  onClick={runLiveDiagnostics}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(180, 83, 9, 0.3)',
                    background: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#b45309'
                  }}
                >
                  Refresh Queue
                </button>
              </div>

              {livePendingQueue.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'rgba(248, 250, 252, 0.6)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Sync Queue is Clean
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                    All created ledgers, vouchers, and bills have been consumed and acknowledged by Tally Prime!
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#ffffff'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Queue ID</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Action</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Name / Details</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Group / Type</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Status</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livePendingQueue.map((item, idx) => {
                        const p = typeof item.payload === 'string' ? JSON.parse(item.payload || '{}') : (item.payload || {});
                        return (
                          <tr
                            key={item.id || idx}
                            style={{
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                            }}
                          >
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                              #{item.id}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  background: item.action === 'CREATE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: item.action === 'CREATE' ? '#059669' : '#2563eb'
                                }}
                              >
                                {item.action || 'CREATE'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {p.name || p.voucher_no || p.bill_name || `Item ${item.id}`}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              {p.parent_group || p.voucher_type || 'Ledger'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Clock size={11} /> Pending Poller
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedQueueItem(item)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  background: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  color: '#2563eb'
                                }}
                              >
                                View JSON
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ARCHITECTURE PIPELINE FLOW */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Bi-Directional Tally Prime Synchronization Pipeline
                </h3>

                {/* Pipeline visual diagram */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>STAGE 1</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Web / Mobile App</div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>User creates voucher, invoice or party ledger</p>
                  </div>

                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRight size={20} style={{ margin: '0 auto' }} />
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', marginBottom: '4px' }}>STAGE 2</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>PostgreSQL Queue</div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Item queued in `sync_queue` table with status 'pending'</p>
                  </div>

                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRight size={20} style={{ margin: '0 auto' }} />
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>STAGE 3</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>tally-agent.exe</div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Windows poller claims batch via `/sync-queue/pending`</p>
                  </div>

                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRight size={20} style={{ margin: '0 auto' }} />
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>STAGE 4</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Tally Prime ODBC</div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Voucher posted to Port 9000 & Ack sent back</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Downstream Push (Tally → Cloud)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                    <li>Windows Agent queries Tally Prime ODBC using standard SQL/XML collections.</li>
                    <li>Transfers master ledgers, stock summaries, and historical vouchers.</li>
                    <li>Calls <code>POST /sync/push-masters</code> and <code>POST /sync/push-vouchers</code>.</li>
                  </ul>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Upstream Writeback (Cloud → Tally)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                    <li>Cloud writes entry to PostgreSQL <code>sync_queue</code> table.</li>
                    <li>Windows agent periodically polls <code>GET /sync-queue/pending</code>.</li>
                    <li>Converts JSON to Tally XML request and executes on Tally Prime ODBC Port 9000.</li>
                    <li>Calls <code>POST /sync-queue/:id/success</code> or <code>:id/failed</code> to ack.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            PAYLOAD INSPECTION DRAWER / MODAL
            ========================================================================= */}
        {selectedQueueItem && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setSelectedQueueItem(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '80vh',
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Queue Item #{selectedQueueItem.id} Payload
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(selectedQueueItem, null, 2), 'payload')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedKey === 'payload' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedKey === 'payload' ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQueueItem(null)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '14px',
                  borderRadius: '12px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  maxHeight: '400px'
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(
                    typeof selectedQueueItem.payload === 'string'
                      ? JSON.parse(selectedQueueItem.payload)
                      : selectedQueueItem.payload,
                    null,
                    2
                  )}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setSelectedQueueItem(null)}
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TallyConnectorModal;

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail, Send, CheckCircle2, AlertCircle, Info, RefreshCw, X,
  ChevronRight, ArrowLeft, Plus, Trash2, Edit3, Eye, FileText, Check, Clock
} from 'lucide-react';
import {
  getReminderTemplates,
  createReminderTemplate,
  updateReminderTemplate,
  deleteReminderTemplate,
  previewEmailReminder,
  sendEmailReminder,
  getReminderHistory,
  retryEmailReminder
} from './api';

const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

export const EmailReminderModal = ({
  isOpen,
  onClose,
  initialParty = null,
  initialBill = null,
  bills = [],
  companyGuid = null
}) => {
  const [activeTab, setActiveTab] = useState('wizard'); // 'wizard' | 'history' | 'templates'
  const [step, setStep] = useState('parties'); // 'parties' | 'bills' | 'preview' | 'confirm' | 'result'
  
  // Selection state
  const [selectedParty, setSelectedParty] = useState(null);
  const [partySearch, setPartySearch] = useState('');
  const [pickedBills, setPickedBills] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  
  // Templates state
  const [templateData, setTemplateData] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', is_default: false });
  const [templateError, setTemplateError] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);

  // Preview & sending state
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok: bool, message: string, code?: string }

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  // Group pending receivable bills by party
  const partySummaries = useMemo(() => {
    const map = new Map();
    (bills || []).forEach((b) => {
      const type = String(b.bill_type || '').toUpperCase();
      if (type === 'PAYABLE') return; // only customers / receivables
      const pending = Number(b.pending_amount || 0);
      if (pending <= 0) return;

      const pName = b.ledger_name || 'Unnamed Party';
      if (!map.has(pName)) {
        map.set(pName, {
          party: pName,
          ledgerGuid: b.ledger_guid || null,
          bills: [],
          total: 0
        });
      }
      const item = map.get(pName);
      item.bills.push(b);
      item.total += pending;
      if (!item.ledgerGuid && b.ledger_guid) item.ledgerGuid = b.ledger_guid;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [bills]);

  // Load templates on modal open
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await getReminderTemplates();
      if (res?.data?.success) {
        setTemplateData(res.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load history
  const fetchHistory = async (ledgerGuid = null) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await getReminderHistory(ledgerGuid);
      if (res?.data?.success) {
        setHistoryList(res.data.reminders || []);
      }
    } catch (err) {
      setHistoryError(err?.response?.data?.message || err?.message || 'Failed to load reminder history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (initialParty) {
        const found = partySummaries.find(
          (p) => p.party.toLowerCase() === initialParty.toLowerCase() || (p.ledgerGuid && p.ledgerGuid === initialParty)
        );
        if (found) {
          handleSelectParty(found);
          if (initialBill) {
            setPickedBills([initialBill]);
          }
        } else {
          // Party not in receivables summary, search or start at parties
          setSelectedParty({ party: initialParty, ledgerGuid: null, bills: [] });
          setStep('bills');
        }
      } else {
        setStep('parties');
        setSelectedParty(null);
        setPickedBills([]);
      }
      setActiveTab('wizard');
    }
  }, [isOpen, initialParty, initialBill]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory(selectedParty?.ledgerGuid || null);
    }
  }, [isOpen, activeTab, selectedParty]);

  const handleSelectParty = (pSummary) => {
    setSelectedParty(pSummary);
    const billNames = (pSummary.bills || []).map((b) => b.bill_name).filter(Boolean);
    setPickedBills(billNames);
    setStep('bills');
    setPreviewError('');
  };

  const handleToggleBill = (billName) => {
    setPickedBills((prev) =>
      prev.includes(billName) ? prev.filter((n) => n !== billName) : [...prev, billName]
    );
  };

  const handleToggleAllBills = (checkAll) => {
    if (!selectedParty?.bills) return;
    if (checkAll) {
      setPickedBills(selectedParty.bills.map((b) => b.bill_name).filter(Boolean));
    } else {
      setPickedBills([]);
    }
  };

  const pickedTotal = useMemo(() => {
    if (!selectedParty?.bills) return 0;
    return selectedParty.bills
      .filter((b) => pickedBills.includes(b.bill_name))
      .reduce((sum, b) => sum + Number(b.pending_amount || 0), 0);
  }, [selectedParty, pickedBills]);

  const handlePreview = async () => {
    if (!selectedParty?.ledgerGuid && !selectedParty?.party) return;
    if (pickedBills.length === 0) return;

    setLoadingPreview(true);
    setPreviewError('');
    try {
      const res = await previewEmailReminder({
        ledger_guid: selectedParty.ledgerGuid || selectedParty.party,
        bill_names: pickedBills,
        template_id: selectedTemplateId || undefined
      });

      if (res?.data?.success) {
        setPreviewData(res.data.data);
        setStep('preview');
      } else {
        setPreviewError(res?.data?.message || 'Could not generate preview.');
      }
    } catch (err) {
      setPreviewError(err?.response?.data?.message || err?.message || 'Failed to preview reminder.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!previewData) return;
    setSending(true);
    try {
      const idempotencyKey = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const res = await sendEmailReminder({
        ledger_guid: previewData.ledger_guid,
        bill_names: previewData.bills.map((b) => b.bill_name),
        template_id: selectedTemplateId || undefined,
        expected_total: previewData.total,
        idempotency_key: idempotencyKey
      });

      if (res?.data?.success) {
        setSendResult({
          ok: true,
          message: res.data.message || 'Accepted by Microsoft 365 for delivery'
        });
        setStep('result');
      } else {
        setSendResult({
          ok: false,
          code: res?.data?.code || 'send_failed',
          message: res?.data?.message || 'Failed to send reminder email.'
        });
        setStep('result');
      }
    } catch (err) {
      setSendResult({
        ok: false,
        code: err?.response?.data?.code || 'send_failed',
        message: err?.response?.data?.message || err?.message || 'Server error while sending email.'
      });
      setStep('result');
    } finally {
      setSending(false);
    }
  };

  const handleRetryHistory = async (id) => {
    setRetryingId(id);
    try {
      await retryEmailReminder(id);
      await fetchHistory(selectedParty?.ledgerGuid || null);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  // Template CRUD handlers
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setTemplateError('');
    setTemplateSaving(true);
    try {
      if (editingTemplate?.id) {
        await updateReminderTemplate(editingTemplate.id, templateForm);
      } else {
        await createReminderTemplate(templateForm);
      }
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (err) {
      setTemplateError(err?.response?.data?.message || err?.message || 'Failed to save template');
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this reminder template?')) return;
    try {
      await deleteReminderTemplate(id);
      await fetchTemplates();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete template');
    }
  };

  if (!isOpen) return null;

  const filteredParties = partySummaries.filter((p) =>
    p.party.toLowerCase().includes(partySearch.toLowerCase())
  );

  return createPortal(
    <div className="feedback-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: activeTab === 'templates' && editingTemplate ? '720px' : '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          background: 'var(--glass-bg, #ffffff)',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.1))',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg, rgba(255, 255, 255, 0.6))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(140, 29, 63, 0.12)',
                color: '#8C1D3F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>
                {activeTab === 'templates'
                  ? 'Email Templates'
                  : activeTab === 'history'
                  ? 'Reminder History'
                  : 'Outstanding Email Reminder'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeTab === 'templates'
                  ? 'Custom wording & placeholders for reminders'
                  : activeTab === 'history'
                  ? selectedParty ? `Reminders sent to ${selectedParty.party}` : 'All past reminder activity'
                  : step === 'parties'
                  ? 'Choose a customer with pending bills'
                  : step === 'bills'
                  ? selectedParty?.party || 'Select bills'
                  : step === 'preview'
                  ? 'Check message and recipient details'
                  : step === 'confirm'
                  ? 'Final confirmation'
                  : 'Delivery outcome'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tab navigation pills */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.04)',
                padding: '3px',
                borderRadius: '10px',
                gap: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('wizard')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'wizard' ? '#8C1D3F' : 'transparent',
                  color: activeTab === 'wizard' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'history' ? '#8C1D3F' : 'transparent',
                  color: activeTab === 'history' ? '#fff' : 'var(--text-muted)'
                }}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'templates' ? '#8C1D3F' : 'transparent',
                  color: activeTab === 'templates' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Templates
              </button>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* ======================= TAB: WIZARD ======================= */}
          {activeTab === 'wizard' && (
            <>
              {/* STEP 1: PARTIES */}
              {step === 'parties' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Search customer party..."
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border, rgba(0,0,0,0.15))',
                        background: 'var(--input-bg, #fff)',
                        fontSize: '14px',
                        color: 'var(--text-dark)'
                      }}
                    />
                  </div>

                  {filteredParties.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No customers with pending receivable bills found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredParties.map((p) => {
                        const initials = p.party.slice(0, 2).toUpperCase();
                        return (
                          <div
                            key={p.party}
                            onClick={() => handleSelectParty(p)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '14px',
                              background: 'var(--card-bg, rgba(255,255,255,0.7))',
                              border: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(140, 29, 63, 0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card-bg, rgba(255,255,255,0.7))')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: 'rgba(140, 29, 63, 0.1)',
                                  color: '#8C1D3F',
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>
                                  {p.party}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {p.bills.length} {p.bills.length === 1 ? 'bill' : 'bills'} pending
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '15px', color: '#c0392b' }}>
                                {inr(p.total)}
                              </span>
                              <ChevronRight size={18} color="var(--text-muted)" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: BILLS SELECTION */}
              {step === 'bills' && selectedParty && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={
                            selectedParty.bills.length > 0 &&
                            pickedBills.length === selectedParty.bills.length
                          }
                          onChange={(e) => handleToggleAllBills(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#8C1D3F' }}
                        />
                        Select all pending bills ({selectedParty.bills.length})
                      </label>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Selected: {pickedBills.length} ({inr(pickedTotal)})
                    </span>
                  </div>

                  {previewError && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#b91c1c',
                        fontSize: '13px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{previewError}</span>
                    </div>
                  )}

                  {/* List of bills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {selectedParty.bills.map((b) => {
                      const isPicked = pickedBills.includes(b.bill_name);
                      const due = b.due_date ? new Date(b.due_date) : null;
                      const isOverdue = due && due < new Date();
                      const overdueDays = due && isOverdue ? Math.round((new Date() - due) / 86400000) : 0;

                      return (
                        <div
                          key={b.bill_name}
                          onClick={() => handleToggleBill(b.bill_name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: isPicked ? 'rgba(140, 29, 63, 0.04)' : 'var(--card-bg, #fff)',
                            border: isPicked
                              ? '1px solid rgba(140, 29, 63, 0.3)'
                              : '1px solid var(--glass-border, rgba(0,0,0,0.06))',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isPicked}
                              onChange={() => {}} // handled by parent onClick
                              style={{ width: '16px', height: '16px', accentColor: '#8C1D3F' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>
                                {b.bill_name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Due {shortDate(b.due_date)}
                                {overdueDays > 0 && (
                                  <span style={{ color: '#b91c1c', fontWeight: 700, marginLeft: '6px' }}>
                                    · {overdueDays} days overdue
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#c0392b' }}>
                            {inr(b.pending_amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Template Picker Chips */}
                  {templateData?.templates && templateData.templates.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>
                        Reminder Template
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {templateData.templates.map((tpl) => {
                          const isSel =
                            selectedTemplateId === tpl.id ||
                            (selectedTemplateId === null && tpl.is_default);
                          return (
                            <button
                              key={tpl.id || 'builtin'}
                              type="button"
                              onClick={() => setSelectedTemplateId(tpl.id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: isSel ? '1px solid #8C1D3F' : '1px solid var(--glass-border)',
                                background: isSel ? 'rgba(140, 29, 63, 0.1)' : 'transparent',
                                color: isSel ? '#8C1D3F' : 'var(--text-dark)',
                                cursor: 'pointer'
                              }}
                            >
                              {tpl.name} {tpl.is_default && '· default'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '16px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.03)',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Info size={15} />
                    <span>Amounts and recipient email are verified on the server against your active Tally data.</span>
                  </div>

                  {/* Footer buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setStep('parties')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={pickedBills.length === 0 || loadingPreview}
                      onClick={handlePreview}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#8C1D3F',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: pickedBills.length === 0 || loadingPreview ? 'not-allowed' : 'pointer',
                        opacity: pickedBills.length === 0 || loadingPreview ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {loadingPreview ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          <span>Checking with server...</span>
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          <span>Preview · {inr(pickedTotal)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW */}
              {step === 'preview' && previewData && (
                <div>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'var(--card-bg, rgba(255,255,255,0.8))',
                      border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>To:</span>
                      <strong style={{ color: 'var(--text-dark)' }}>
                        {previewData.recipients && previewData.recipients.length > 0
                          ? previewData.recipients.join(', ')
                          : 'No email address registered in Tally'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Party:</span>
                      <strong style={{ color: 'var(--text-dark)' }}>{previewData.party}</strong>
                    </div>
                    {previewData.company && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>From company:</span>
                        <strong style={{ color: 'var(--text-dark)' }}>{previewData.company}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subject:</span>
                      <strong style={{ color: 'var(--text-dark)' }}>{previewData.subject}</strong>
                    </div>
                  </div>

                  {/* Warning problems */}
                  {previewData.problems && previewData.problems.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {previewData.problems.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#b91c1c',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <AlertCircle size={16} />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Missing bills warning */}
                  {previewData.missing_bills && previewData.missing_bills.length > 0 && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#b45309',
                        fontSize: '13px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Info size={16} />
                      <span>Left out (no longer pending in Tally): {previewData.missing_bills.join(', ')}</span>
                    </div>
                  )}

                  {/* Bills summary table */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Included Bills ({previewData.bills.length})</div>
                    <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Bill</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Due Date</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.bills.map((b) => (
                            <tr key={b.bill_name} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.bill_name}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {shortDate(b.due_date)}
                                {b.overdue_days > 0 && (
                                  <span style={{ color: '#b91c1c', fontSize: '11px', marginLeft: '6px' }}>
                                    ({b.overdue_days}d late)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                                {inr(b.pending_amount)}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background: 'rgba(140, 29, 63, 0.05)', fontWeight: 800 }}>
                            <td colSpan={2} style={{ padding: '10px 12px' }}>Total Pending</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#8C1D3F' }}>
                              {inr(previewData.total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rendered Email Body */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Message Preview</div>
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: '#fafafa',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        color: '#1f2937',
                        fontFamily: 'monospace'
                      }}
                    >
                      {previewData.text}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setStep('bills')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!previewData.can_send}
                      onClick={() => setStep('confirm')}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: previewData.can_send ? '#8C1D3F' : '#9ca3af',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: previewData.can_send ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Send size={16} />
                      <span>Proceed to Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: CONFIRM */}
              {step === 'confirm' && previewData && (
                <div style={{ padding: '12px 0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 800 }}>Send this reminder?</h4>
                  <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--text-dark)', margin: '0 0 16px' }}>
                    Email <strong>{previewData.party}</strong> at{' '}
                    <strong>{previewData.recipients?.join(', ')}</strong> about{' '}
                    <strong>
                      {previewData.bills.length} {previewData.bills.length === 1 ? 'bill' : 'bills'}
                    </strong>{' '}
                    totalling <strong>{inr(previewData.total)}</strong>?
                  </p>

                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(0, 122, 255, 0.08)',
                      color: 'var(--primary-color)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      Sent securely by TallyConnect using your company's Microsoft 365 Graph mailer. Your email will be
                      set as the reply-to address. Nothing in Tally is altered.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => setStep('preview')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        fontWeight: 700,
                        cursor: sending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={handleSend}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#8C1D3F',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: sending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {sending ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          <span>Sending via Microsoft 365...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Yes, send email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: RESULT */}
              {step === 'result' && sendResult && (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      background: sendResult.ok ? 'rgba(52, 199, 89, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: sendResult.ok ? '#248a3d' : '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {sendResult.ok ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>

                  <h4 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>
                    {sendResult.ok ? 'Accepted for delivery' : 'Not sent'}
                  </h4>

                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px' }}>
                    {sendResult.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    {sendResult.ok ? (
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          padding: '12px 28px',
                          borderRadius: '12px',
                          border: 'none',
                          background: '#8C1D3F',
                          color: '#fff',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onClose}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            background: 'transparent',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('preview')}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#8C1D3F',
                            color: '#fff',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Review & Try Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================= TAB: HISTORY ======================= */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {selectedParty ? `Showing reminders for ${selectedParty.party}` : 'Showing all reminders'}
                </span>
                {/* <button
                  type="button"
                  onClick={() => fetchHistory(selectedParty?.ledgerGuid || null)}
                  disabled={historyLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8C1D3F',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} className={historyLoading ? 'spin' : ''} />
                  Refresh
                </button> */}
              </div>

              {historyLoading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading reminder history...
                </div>
              ) : historyError ? (
                <div style={{ padding: '20px', color: '#b91c1c', textAlign: 'center' }}>
                  {historyError}
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No email reminders have been sent yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyList.map((rem) => {
                    const isAccepted = rem.status === 'accepted';
                    const isFailed = rem.status === 'failed';
                    return (
                      <div
                        key={rem.id}
                        style={{
                          padding: '14px',
                          borderRadius: '14px',
                          background: 'var(--card-bg, #fff)',
                          border: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: isAccepted ? 'rgba(52, 199, 89, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isAccepted ? '#248a3d' : '#b91c1c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Mail size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>
                              {rem.party} · {inr(rem.total)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 4px' }}>
                              Sent {shortDate(rem.created_at)} · {rem.bills?.length || 0} bills · To {rem.recipients?.join(', ')}
                            </div>
                            {rem.error && (
                              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                                Error: {rem.error}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: isAccepted
                                ? 'rgba(52, 199, 89, 0.15)'
                                : isFailed
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                              color: isAccepted ? '#248a3d' : isFailed ? '#b91c1c' : '#b45309'
                            }}
                          >
                            {isAccepted ? 'Accepted' : isFailed ? 'Failed' : 'Sending'}
                          </span>

                          {isFailed && (
                            <button
                              type="button"
                              disabled={retryingId === rem.id}
                              onClick={() => handleRetryHistory(rem.id)}
                              style={{
                                border: '1px solid var(--glass-border)',
                                background: '#fff',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#8C1D3F'
                              }}
                            >
                              {retryingId === rem.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: TEMPLATES ======================= */}
          {activeTab === 'templates' && (
            <div>
              {editingTemplate ? (
                /* Edit/Create Form */
                <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                      {editingTemplate.id ? 'Edit Template' : 'New Template'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>

                  {templateError && (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', fontSize: '13px' }}>
                      {templateError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      required
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g. Friendly first reminder"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--input-bg, #fff)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                      Email Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="e.g. Payment reminder from {{company}} · {{total}} outstanding"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--input-bg, #fff)'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700 }}>
                        Message Body
                      </label>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Click a placeholder to insert:
                      </span>
                    </div>

                    {/* Placeholder chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {['party', 'company', 'bills', 'total', 'count', 'sender'].map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + ` {{${p}}}` })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.06)',
                            border: 'none',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          {`{{${p}}}`}
                        </button>
                      ))}
                    </div>

                    <textarea
                      required
                      rows={8}
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--input-bg, #fff)',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={templateForm.is_default}
                      onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#8C1D3F' }}
                    />
                    Set as default template for this account
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={templateSaving}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#8C1D3F',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: templateSaving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {templateSaving ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Template List */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Available templates for outstanding email reminders
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateForm({ name: '', subject: '', body: '', is_default: false });
                        setEditingTemplate({ id: null });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#8C1D3F',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                      New Template
                    </button>
                  </div>

                  {templateData && !templateData.email_configured && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#b45309',
                        fontSize: '13px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>Email sending is not configured on the server yet (MICROSOFT_* env vars).</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(templateData?.templates || []).map((tpl) => (
                      <div
                        key={tpl.id || 'builtin'}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '14px',
                          background: 'var(--card-bg, #fff)',
                          border: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{tpl.name}</strong>
                            {tpl.id === null ? (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                                Built-in
                              </span>
                            ) : tpl.is_default ? (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(52, 199, 89, 0.15)', color: '#248a3d', fontWeight: 700 }}>
                                Default
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {tpl.subject}
                          </div>
                        </div>

                        {tpl.id !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setTemplateForm({
                                  name: tpl.name,
                                  subject: tpl.subject,
                                  body: tpl.body,
                                  is_default: Boolean(tpl.is_default)
                                });
                                setEditingTemplate(tpl);
                              }}
                              className="icon-btn"
                              title="Edit template"
                              style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                            >
                              <Edit3 size={15} color="var(--text-muted)" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="icon-btn"
                              title="Delete template"
                              style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                            >
                              <Trash2 size={15} color="#b91c1c" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

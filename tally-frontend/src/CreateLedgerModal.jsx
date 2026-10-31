import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Landmark, CheckCircle2, AlertCircle, Loader2,
  Building, Mail, Phone, MapPin, Hash, Plus, Check
} from 'lucide-react';
import { api } from './api';
import GlassSelect from './GlassSelect';

const TALLY_GROUPS = [
  'Sundry Debtors',
  'Sundry Creditors',
  'Bank Accounts',
  'Cash-in-hand',
  'Direct Expenses',
  'Indirect Expenses',
  'Direct Incomes',
  'Indirect Incomes',
  'Sales Accounts',
  'Purchase Accounts',
  'Duties & Taxes',
  'Capital Account',
  'Loans (Liability)',
  'Current Assets',
  'Current Liabilities',
  'Fixed Assets',
  'Investments',
  'Provisions',
  'Reserves & Surplus',
  'Secured Loans',
  'Unsecured Loans',
  'Deposits (Asset)',
  'Loans & Advances (Asset)'
];

export default function CreateLedgerModal({
  isOpen,
  onClose,
  companyGuid,
  onSuccess,
  ledgerToEdit = null
}) {
  const [name, setName] = useState('');
  const [parentGroup, setParentGroup] = useState('Sundry Debtors');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState('Dr'); // Dr or Cr
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(ledgerToEdit && (ledgerToEdit.ledger_guid || ledgerToEdit.id));

  useEffect(() => {
    if (ledgerToEdit) {
      setName(ledgerToEdit.name || '');
      setParentGroup(ledgerToEdit.parent_group || ledgerToEdit.type || 'Sundry Debtors');
      const bal = Number(ledgerToEdit.opening_balance ?? ledgerToEdit.balance ?? 0);
      setOpeningBalance(bal !== 0 ? String(Math.abs(bal)) : '');
      setBalanceType(bal < 0 ? 'Cr' : 'Dr');
      setEmail(ledgerToEdit.email || '');
      setPhone(ledgerToEdit.phone || '');
      setAddress(ledgerToEdit.address || '');
      setStateName(ledgerToEdit.state || '');
      setPincode(ledgerToEdit.pincode || '');
    } else {
      setName('');
      setParentGroup('Sundry Debtors');
      setOpeningBalance('');
      setBalanceType('Dr');
      setEmail('');
      setPhone('');
      setAddress('');
      setStateName('');
      setPincode('');
    }
    setError('');
  }, [ledgerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Ledger name is required');
      return;
    }

    if (!companyGuid) {
      setError('Please select an active company first');
      return;
    }

    setLoading(true);

    try {
      const ledgerGuid = isEdit
        ? (ledgerToEdit.ledger_guid || ledgerToEdit.id)
        : `tc_ledger_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const numBalance = Number(openingBalance) || 0;
      const signedBalance = balanceType === 'Cr' ? -Math.abs(numBalance) : Math.abs(numBalance);

      const payload = {
        ledger_guid: ledgerGuid,
        company_guid: companyGuid,
        name: name.trim(),
        parent_group: parentGroup,
        opening_balance: signedBalance,
        closing_balance: isEdit && ledgerToEdit.closing_balance !== undefined ? Number(ledgerToEdit.closing_balance) : signedBalance,
        type: parentGroup,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        state: stateName.trim() || null,
        pincode: pincode.trim() || null,
        country: 'India'
      };

      // 1. Send to backend ledger sync endpoint (handles insert or update via ON CONFLICT)
      const res = await api.post('/ledger/sync', payload);
      if (res && res.success === false) {
        throw new Error(res.error || res.message || 'Failed to save ledger');
      }

      // 2. Also register sync event in queue for desktop agent
      api.post('/sync/event', {
        entity_type: 'LEDGER',
        entity_guid: ledgerGuid,
        company_guid: companyGuid,
        operation: isEdit ? 'UPDATE' : 'CREATE',
        source: 'WEB_APP',
        payload
      }).catch(() => {});

      // 3. Invalidate cached ledgers so lists refetch fresh data
      try {
        api.invalidate('/ledger');
      } catch {}

      if (onSuccess) {
        onSuccess({ ...payload, isEdit });
      }
      onClose();
    } catch (err) {
      console.error('Save ledger error:', err);
      setError(err?.message || 'Failed to save ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--glass-card-bg, #ffffff)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.1))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.04), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #007aff, #0056b3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
              }}
            >
              <Landmark size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark, #1e293b)' }}>
                {isEdit ? 'Edit Ledger Details' : 'Create New Ledger'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                {isEdit ? `Update fields for ${name || 'ledger'}` : 'Add a new customer, supplier, bank, or expense account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '24px', overflowY: 'auto', overscrollBehavior: 'contain', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Ledger Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                Ledger Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp Pvt Ltd or HDFC Bank"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                  background: 'var(--input-bg, rgba(255,255,255,0.8))',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--input-color, var(--text-dark, #1e293b))',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Parent Group */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                Parent Group <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <GlassSelect
                value={parentGroup}
                onChange={(e, val) => setParentGroup(val)}
                options={TALLY_GROUPS}
                placeholder="Select parent group..."
                searchable={true}
              />
            </div>

            {/* Opening Balance */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                Opening Balance
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                    background: 'var(--input-bg, rgba(255,255,255,0.8))',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--input-color, var(--text-dark, #1e293b))',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'inline-flex', padding: '3px', background: 'var(--btn-secondary-bg, rgba(0,0,0,0.06))', borderRadius: '12px', gap: '3px', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))' }}>
                  <button
                    type="button"
                    onClick={() => setBalanceType('Dr')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '9px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: balanceType === 'Dr' ? '#007aff' : 'transparent',
                      color: balanceType === 'Dr' ? '#ffffff' : 'var(--text-muted, #64748b)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Dr
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceType('Cr')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '9px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: balanceType === 'Cr' ? '#007aff' : 'transparent',
                      color: balanceType === 'Cr' ? '#ffffff' : 'var(--text-muted, #64748b)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Cr
                  </button>
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                    background: 'var(--input-bg, rgba(255,255,255,0.8))',
                    fontSize: '13px',
                    color: 'var(--input-color, var(--text-dark, #1e293b))',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                  Phone / Mobile
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                    background: 'var(--input-bg, rgba(255,255,255,0.8))',
                    fontSize: '13px',
                    color: 'var(--input-color, var(--text-dark, #1e293b))',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                Address
              </label>
              <textarea
                rows={2}
                placeholder="Building, street, area..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                  background: 'var(--input-bg, rgba(255,255,255,0.8))',
                  fontSize: '13px',
                  color: 'var(--input-color, var(--text-dark, #1e293b))',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* State & Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                    background: 'var(--input-bg, rgba(255,255,255,0.8))',
                    fontSize: '13px',
                    color: 'var(--input-color, var(--text-dark, #1e293b))',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #1e293b)', marginBottom: '6px' }}>
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border, var(--glass-border, rgba(0,0,0,0.15)))',
                    background: 'var(--input-bg, rgba(255,255,255,0.8))',
                    fontSize: '13px',
                    color: 'var(--input-color, var(--text-dark, #1e293b))',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'var(--glass-card-bg, rgba(0,0,0,0.02))'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                padding: '8px 22px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <Loader2 size={16} className="spin" />
              ) : isEdit ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}
              {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Ledger')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

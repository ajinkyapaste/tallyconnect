import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag, ShoppingCart, ArrowDownToLine, ArrowUpFromLine,
  BookOpen, Truck, Receipt, Calendar, Hash, User, Plus,
  ChevronLeft, ChevronRight, X, HelpCircle, Check, CheckCircle2,
  AlertCircle, Building2, Laptop, ChevronDown, ChevronUp, Mail,
  Globe, Percent, Trash2, CreditCard, Wallet, FileText, Sparkles, Sliders,
  ArrowLeftRight
} from 'lucide-react';
import {
  api,
  getEntryFieldSettings,
  updateEntryFieldSettings,
  createCustomEntryField,
  updateCustomEntryField,
  deleteCustomEntryField,
  createMobileContra,
  editMobileVoucher
} from './api';
import GlassSelect from './GlassSelect';

/* ------------------------------------------------------------------
   Voucher Type Configurations
   ------------------------------------------------------------------ */
export const VOUCHER_TYPES_CONFIG = [
  {
    id: 'Sales',
    title: 'New Sale',
    subtitle: 'Sales bill',
    icon: ShoppingBag,
    color: '#e11d48',
    partyLabel: 'Customer',
    isItemized: true
  },
  {
    id: 'Purchase',
    title: 'New Purchase',
    subtitle: 'Purchase bill',
    icon: ShoppingCart,
    color: '#2563eb',
    partyLabel: 'Supplier',
    isItemized: true
  },
  {
    id: 'Receipt',
    title: 'New Receipt',
    subtitle: 'Receipt voucher',
    icon: ArrowDownToLine,
    color: '#059669',
    partyLabel: 'Received From',
    isItemized: false
  },
  {
    id: 'Payment',
    title: 'New Payment',
    subtitle: 'Payment voucher',
    icon: ArrowUpFromLine,
    color: '#d97706',
    partyLabel: 'Paid To',
    isItemized: false
  },
  {
    id: 'Journal',
    title: 'New Journal',
    subtitle: 'Journal adjustment',
    icon: BookOpen,
    color: '#7c3aed',
    partyLabel: 'Primary Account',
    isItemized: false
  },
  {
    id: 'Contra',
    title: 'New Contra',
    subtitle: 'Cash / Bank transfer',
    icon: ArrowLeftRight,
    color: '#0d9488',
    partyLabel: 'From Account (Money out)',
    accountLabel: 'To Account (Money in)',
    isItemized: false
  },
  {
    id: 'Delivery Challan',
    title: 'New Delivery Challan',
    subtitle: 'Delivery challan',
    icon: Truck,
    color: '#0891b2',
    partyLabel: 'Consignee / Customer',
    isItemized: true
  }
];

/* ------------------------------------------------------------------
   Preset Stock Items for Instant Autocomplete & Demo
   ------------------------------------------------------------------ */
const PRESET_STOCK_ITEMS = [
  { name: 'Protein Powder 1kg', rate: 2450, unit: 'JAR', tax_rate: 18 },
  { name: 'Smart Fitness Band X', rate: 1999, unit: 'PCS', tax_rate: 18 },
  { name: 'Yoga Mat Pro 6mm', rate: 850, unit: 'PCS', tax_rate: 12 },
  { name: 'Whey Isolate 2kg', rate: 4950, unit: 'JAR', tax_rate: 18 },
  { name: 'Athletic Running Shoes', rate: 3200, unit: 'PAIR', tax_rate: 18 },
  { name: 'Gym Training Shaker 700ml', rate: 350, unit: 'PCS', tax_rate: 18 },
  { name: 'Resistance Band Set', rate: 699, unit: 'SET', tax_rate: 12 },
  { name: 'Cotton Workout T-Shirt', rate: 599, unit: 'PCS', tax_rate: 5 },
  { name: 'Electrolyte Energy Drink 500g', rate: 420, unit: 'CAN', tax_rate: 18 },
  { name: 'Heavy Duty Jump Rope', rate: 299, unit: 'PCS', tax_rate: 12 }
];

/* ------------------------------------------------------------------
   Default Customer Options (Required by Specification)
   ------------------------------------------------------------------ */
export const DEFAULT_CUSTOMER_OPTIONS = [
  'Cult.Fit Limited (Maharashtra)',
  'Acme Traders',
  'Reliance Retail',
  'Tata Consumer',
  'Steel Corp of India',
  'THE LIGHT HOUSE NEW'
];

/* ------------------------------------------------------------------
   FAQ List matching Screenshots 2, 3, 4
   ------------------------------------------------------------------ */
const FAQ_ITEMS = [
  {
    id: 'faq-1',
    q: 'What is Tally Connect?',
    a: 'Tally Connect is a web app that connects to your Tally Prime and turns your accounting data into easy-to-read dashboards and reports. Instead of opening Tally every time you need a number, just open Tally Connect.'
  },
  {
    id: 'faq-2',
    q: 'How does the auto-sync work?',
    a: 'A small background service running on your Windows computer sends new entries and changes from Tally Prime every 5 minutes. Sync is bidirectional, lightweight, and encrypted.'
  },
  {
    id: 'faq-3',
    q: 'How do I get the sync app set up?',
    a: 'Download the TallyConnect Desktop Agent from the Downloads section, run the installer on the PC hosting Tally Prime, input your Company GUID, and sync begins instantly.'
  },
  {
    id: 'faq-4',
    q: 'How do I get started?',
    a: 'Once connected, your vouchers, accounts, and inventory appear in real-time. You can invite team members with granular view/edit permissions and create invoices from anywhere.'
  },
  {
    id: 'faq-5',
    q: 'Can I create vouchers and bills without opening Tally?',
    a: 'Yes! Vouchers and bills made here are pushed into Tally Prime automatically via the mobile sync command pipeline.'
  },
  {
    id: 'faq-6',
    q: 'Is my financial data safe?',
    a: 'Your financial data is encrypted in transit and at rest using bank-grade 256-bit AES/TLS standards. We never share or sell your business data.'
  },
  {
    id: 'faq-7',
    q: 'Can I control what my team members are allowed to see?',
    a: 'Yes. Administrators can set role-based permissions to restrict sensitive reports, ledgers, or creation permissions for specific staff.'
  },
  {
    id: 'faq-8',
    q: 'Can I manage more than one company?',
    a: 'Yes, TallyConnect supports multi-company management. You can switch between connected companies anytime using the top company selector.'
  },
  {
    id: 'faq-9',
    q: 'Can multiple people be logged in at the same time?',
    a: 'Yes, your team can access TallyConnect simultaneously across desktops, tablets, and smartphones without conflicts.'
  },
  {
    id: 'faq-10',
    q: 'What if my internet or Tally goes offline?',
    a: 'Entries created while offline or while Tally is closed are safely stored in your TallyConnect queue. They will sync automatically as soon as Tally reconnects.'
  }
];

export const CreateVoucherWizard = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'Sales',
  companyGuid,
  activeCompanyName = 'Lumilo',
  parties = [],
  showToast = () => {},
  initialVoucher = null
}) => {
  // Current step in the 4-step wizard: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState('faq-1');
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);

  // Voucher Type Selection
  const [voucherType, setVoucherType] = useState(initialType);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // Close type dropdown on click outside
  useEffect(() => {
    if (!isTypeDropdownOpen) return;
    const handleOutside = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isTypeDropdownOpen]);

  const activeConfig = useMemo(() => {
    return VOUCHER_TYPES_CONFIG.find((c) => c.id === voucherType) || VOUCHER_TYPES_CONFIG[0];
  }, [voucherType]);

  const wizardSteps = useMemo(() => {
    if (activeConfig.isItemized) {
      return [
        { step: 1, label: 'Details' },
        { step: 2, label: 'Items' },
        { step: 3, label: 'Payment' },
        { step: 4, label: 'Check' }
      ];
    }
    if (voucherType === 'Receipt' || voucherType === 'Payment') {
      return [
        { step: 1, label: 'Details' },
        { step: 2, label: 'How Paid' },
        { step: 3, label: 'Check' }
      ];
    }
    if (voucherType === 'Contra') {
      return [
        { step: 1, label: 'Accounts' },
        { step: 2, label: 'Transfer Details' },
        { step: 3, label: 'Check' }
      ];
    }
    return [
      { step: 1, label: 'Details' },
      { step: 2, label: 'Entries' },
      { step: 3, label: 'Check' }
    ];
  }, [voucherType, activeConfig.isItemized]);

  // Form Fields - Step 1: Details (Matches Screenshot 1)
  const [billNo, setBillNo] = useState('');
  const [voucherDate, setVoucherDate] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [payByDate, setPayByDate] = useState('');
  const [note, setNote] = useState('');

  // Field customization state loaded from backend
  const [fieldSettings, setFieldSettings] = useState({
    due_date: true,
    discount: true,
    gst: true,
    hsn_sac: true,
    reference_no: true,
    sales_person: true,
    bank_payment_details: true,
    narration: true
  });
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [showFieldSettingsModal, setShowFieldSettingsModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getEntryFieldSettings(voucherType);
        if (active && res) {
          if (res.fields) {
            setFieldSettings((prev) => ({ ...prev, ...res.fields }));
          }
          if (Array.isArray(res.customFields)) {
            setCustomFields(res.customFields);
          }
        }
      } catch (err) {
        console.warn('Could not fetch field settings for', voucherType, err?.message);
      }
    })();
    return () => { active = false; };
  }, [voucherType]);

  // Form Fields - Step 2: Items
  const [items, setItems] = useState([]);

  // Form Fields - Step 2 (Non-inventory Dr / Cr fallback)
  const [ledgerRows, setLedgerRows] = useState([
    { ledger_name: '', is_debit: true, amount: '' },
    { ledger_name: '', is_debit: false, amount: '' }
  ]);

  // Form Fields - Step 3: Payment
  const [paymentMode, setPaymentMode] = useState('UNPAID'); // 'UNPAID' | 'CASH' | 'BANK'
  const [amountReceived, setAmountReceived] = useState('');
  const [bankLedger, setBankLedger] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Contra Voucher Specific State
  const [toAccount, setToAccount] = useState('');
  const [contraAmount, setContraAmount] = useState('');
  const [instrumentNo, setInstrumentNo] = useState('');

  const handleVoucherTypeChange = (nextType) => {
    setVoucherType(nextType);
    setCurrentStep(1);
    setErrorMessage('');
    setAmountReceived('');
    setPaymentRef('');
    if (!['Sales', 'Purchase'].includes(nextType)) setPayByDate('');
    setPaymentMode(nextType === 'Receipt' || nextType === 'Payment' ? 'CASH' : 'UNPAID');
    if (nextType === 'Contra') {
      if (cashBankAccounts.length > 0) {
        setSelectedParty(cashBankAccounts[0]);
        setToAccount(cashBankAccounts[1] || cashBankAccounts[0]);
      }
    }
    setIsTypeDropdownOpen(false);
  };

  // Add Party Form State
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyGroup, setNewPartyGroup] = useState('Sundry Debtors');
  const [newPartyState, setNewPartyState] = useState('Maharashtra');
  const [newPartyPhone, setNewPartyPhone] = useState('');

  // Local list of parties
  const [localParties, setLocalParties] = useState([]);
  const [availableStockItems, setAvailableStockItems] = useState(PRESET_STOCK_ITEMS);

  // Cash / Bank accounts for Contra, Payment & Receipt - dynamically pulled from company's backend ledgers
  const cashBankAccounts = useMemo(() => {
    const dynamicAccounts = (localParties || []).filter((p) => {
      const name = String(p.name || p.ledger_name || '');
      const parent = String(p.parent || p.parent_group || p.group_name || '').toLowerCase();
      return name && (/bank|cash/i.test(parent) || /bank|cash/i.test(name));
    }).map((p) => p.name || p.ledger_name);

    if (dynamicAccounts.length > 0) {
      return Array.from(new Set(dynamicAccounts));
    }
    // Fallback only if company has no synced bank accounts yet or in fresh demo mode
    return ['Cash in Hand', 'Petty Cash', 'Primary Bank Account'];
  }, [localParties]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize or reset wizard when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setShowHelp(false);
      setErrorMessage('');

      if (initialVoucher) {
        setVoucherType(initialVoucher.voucher_type || initialType);
        setBillNo(initialVoucher.voucher_no || initialVoucher.details?.voucher_no || '');
        setVoucherDate(initialVoucher.date || initialVoucher.voucher_date || '');
        setPayByDate(initialVoucher.details?.pay_by_date || initialVoucher.details?.due_date || '');
        setSelectedParty(initialVoucher.customer || initialVoucher.party_name || initialVoucher.details?.party_name || '');
        setNote(initialVoucher.details?.narration || initialVoucher.details?.note || '');
        setAmountReceived(String(initialVoucher.amount_received ?? initialVoucher.amount_paid ?? initialVoucher.payment?.amount_received ?? initialVoucher.payment?.amount_paid ?? ''));
        setPaymentMode(initialVoucher.payment?.payment_mode || 'CASH');
        setPaymentRef(initialVoucher.payment?.reference || initialVoucher.payment?.remarks || initialVoucher.reference_no || '');
        if (initialVoucher.voucher_type === 'Contra' || initialVoucher.transfer) {
          setSelectedParty(initialVoucher.transfer?.from_account || initialVoucher.from_account || 'Cash');
          setToAccount(initialVoucher.transfer?.to_account || initialVoucher.to_account || 'HDFC Bank');
          setContraAmount(String(initialVoucher.transfer?.amount || initialVoucher.amount || ''));
          setInstrumentNo(initialVoucher.transfer?.instrument_no || initialVoucher.instrument_no || '');
        }
        if (Array.isArray(initialVoucher.details?.items) && initialVoucher.details.items.length > 0) {
          setItems(initialVoucher.details.items);
        } else if (Array.isArray(initialVoucher.items) && initialVoucher.items.length > 0) {
          setItems(initialVoucher.items);
        } else {
          setItems([]);
        }
      } else {
        setVoucherType(initialType);
        setBillNo('');
        setVoucherDate(new Date().toISOString().slice(0, 10));
        setPayByDate('');
        setSelectedParty(initialType === 'Contra' ? 'Cash' : '');
        setToAccount('HDFC Bank');
        setContraAmount('');
        setInstrumentNo('');
        setNote('');
        setAmountReceived('');
        setPaymentMode(initialType === 'Receipt' || initialType === 'Payment' ? 'CASH' : 'UNPAID');
        setPaymentRef('');
        setItems([]);
        setLedgerRows([
          { ledger_name: '', is_debit: true, amount: '' },
          { ledger_name: '', is_debit: false, amount: '' }
        ]);
      }
    }
  }, [isOpen, initialType, initialVoucher]);

  // Load parties strictly from real application ledger data
  useEffect(() => {
    if (parties && parties.length > 0) {
      setLocalParties(parties);
    } else {
      // Fetch from API
      api.get('/ledger', companyGuid ? { company_guid: companyGuid } : {})
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setLocalParties(list);
        })
        .catch(() => {
          setLocalParties([]);
        });
    }
  }, [parties, companyGuid]);

  // Fetch stock items from /inventory if available
  useEffect(() => {
    let effectiveGuid = companyGuid;
    if (!effectiveGuid) {
      try { effectiveGuid = localStorage.getItem('tc_active_company'); } catch {}
    }
    api.get('/inventory', effectiveGuid ? { company_guid: effectiveGuid } : {})
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          const formatted = list.map((item) => ({
            name: item.name || item.item_name,
            rate: Number(item.rate) || 1000,
            unit: 'PCS',
            tax_rate: 18
          }));
          setAvailableStockItems(formatted);
        }
      })
      .catch(() => {
        // Keep PRESET_STOCK_ITEMS
      });
  }, []);

  // Compute Calculations for Step 2
  const itemCalculations = useMemo(() => {
    if (voucherType === 'Contra') {
      const amt = Number(contraAmount) || 0;
      return {
        subtotal: amt,
        totalDiscount: 0,
        cgst: 0,
        sgst: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: amt
      };
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((it) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      const base = q * r;
      const disc = base * ((Number(it.discount_pct) || 0) / 100);
      const net = base - disc;
      const tax = net * ((Number(it.tax_rate) || 0) / 100);

      subtotal += net;
      totalDiscount += disc;
      totalTax += tax;
    });

    const totalBeforeRound = subtotal + totalTax;
    const roundedTotal = Math.round(totalBeforeRound);
    const roundOff = Number((roundedTotal - totalBeforeRound).toFixed(2));

    return {
      subtotal,
      totalDiscount,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      totalTax,
      roundOff,
      grandTotal: roundedTotal
    };
  }, [items, voucherType, contraAmount]);

  // Sync amount received in Step 3
  useEffect(() => {
    if (paymentMode === 'UNPAID') {
      setAmountReceived('0');
    } else {
      setAmountReceived(String(itemCalculations.grandTotal));
    }
  }, [paymentMode, itemCalculations.grandTotal]);

  // Helpers
  const formatInr = (n) => {
    const num = Number(n || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPartyInitial = (name) => {
    if (!name) return 'C';
    const clean = name.trim();
    return clean.charAt(0).toUpperCase();
  };

  // Add Item to list
  const handleAddItem = (preset) => {
    if (preset) {
      setItems((prev) => [
        ...prev,
        {
          stock_item_name: preset.name,
          quantity: 1,
          rate: preset.rate,
          unit: preset.unit || 'PCS',
          discount_pct: 0,
          tax_rate: preset.tax_rate || 18
        }
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          stock_item_name: availableStockItems[0]?.name || 'Standard Item',
          quantity: 1,
          rate: availableStockItems[0]?.rate || 1000,
          unit: 'PCS',
          discount_pct: 0,
          tax_rate: 18
        }
      ]);
    }
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // If stock item changed, update rate & unit
      if (field === 'stock_item_name') {
        const found = availableStockItems.find((s) => s.name === value);
        if (found) {
          copy[index].rate = found.rate;
          copy[index].unit = found.unit || 'PCS';
          copy[index].tax_rate = found.tax_rate || 18;
        }
      }
      return copy;
    });
  };

  // Save new party
  // Save new party
  const handleSaveNewParty = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const inputEl = document.querySelector('input[placeholder*="FitLife"]');
    const name = newPartyName.trim() || inputEl?.value?.trim() || 'FitLife Sports Club (Bandra)';
    const newEntry = {
      name,
      parent_group: newPartyGroup,
      state: newPartyState,
      phone: newPartyPhone,
      closing_balance: 0
    };
    setLocalParties((prev) => [newEntry, ...prev]);
    setSelectedParty(newEntry.name);
    setShowAddPartyModal(false);
    showToast(`Added ${newEntry.name} to parties!`);
    setNewPartyName('');
    setNewPartyPhone('');
  };

  // Validate and advance step
  const handleNextStep = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (voucherType === 'Contra') {
        if (!selectedParty) {
          setErrorMessage('Please select From Account (cash or bank account)');
          return;
        }
        if (!toAccount) {
          setErrorMessage('Please select To Account (cash or bank account)');
          return;
        }
        if (selectedParty.trim().toLowerCase() === toAccount.trim().toLowerCase()) {
          setErrorMessage('From Account and To Account must be different accounts');
          return;
        }
        if (!voucherDate) {
          setErrorMessage('Please enter a valid Date');
          return;
        }
        setCurrentStep(2);
        return;
      }
      if (voucherType !== 'Journal' && !selectedParty) {
        setErrorMessage('Please select or add a Customer / Party');
        return;
      }
      if (!voucherDate) {
        setErrorMessage('Please enter a valid Date');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (voucherType === 'Contra') {
        const amt = Number(contraAmount);
        if (!amt || amt <= 0) {
          setErrorMessage('Please enter an amount greater than ₹0');
          return;
        }
        setCurrentStep(3);
        return;
      }
      if (voucherType === 'Receipt' || voucherType === 'Payment') {
        const amt = Number(amountReceived);
        if (!amt || amt <= 0) {
          setErrorMessage(`Please enter a valid amount ${voucherType === 'Receipt' ? 'received' : 'paid'} greater than ₹0`);
          return;
        }
        if (!bankLedger) {
          setErrorMessage('Please select a Bank or Cash Account');
          return;
        }
        setCurrentStep(3);
        return;
      }
      if (activeConfig.isItemized) {
        if (!items || items.length === 0) {
          setErrorMessage('Please add at least one item');
          return;
        }
        for (let it of items) {
          if (!it.stock_item_name || Number(it.quantity) <= 0 || Number(it.rate) < 0) {
            setErrorMessage('All items must have a name, positive quantity, and valid rate');
            return;
          }
        }
        setCurrentStep(3);
        return;
      } else {
        // Validate Dr / Cr rows
        let dr = 0; let cr = 0;
        for (let row of ledgerRows) {
          if (!row.ledger_name || !row.amount) {
            setErrorMessage('All ledger rows must specify an account name and amount');
            return;
          }
          if (row.is_debit) dr += Number(row.amount);
          else cr += Number(row.amount);
        }
        if (dr !== cr) {
          setErrorMessage(`Debit (${formatInr(dr)}) and Credit (${formatInr(cr)}) must be equal`);
          return;
        }
      }
      if (voucherType === 'Journal') {
        setCurrentStep(4);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if ((voucherType === 'Receipt' || voucherType === 'Payment') && Number(amountReceived) <= 0) {
        setErrorMessage(`Please enter an amount ${voucherType === 'Receipt' ? 'received' : 'paid'} greater than 0`);
        return;
      }
      setCurrentStep(4);
    }
  };

  // Submit Final Voucher (Step 4 Check)
  const handleSaveVoucher = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    const voucherAmount = voucherType === 'Contra'
      ? Number(contraAmount) || 0
      : (voucherType === 'Receipt' || voucherType === 'Payment')
        ? Number(amountReceived) || 0
        : itemCalculations.grandTotal;

    try {
      // Build compliant ledger_entries matching voucherCommand.js rules
      let ledgerEntries = [];
      if (activeConfig.isItemized) {
        if (voucherType === 'Purchase') {
          ledgerEntries = [
            {
              ledger_name: 'Purchase Account',
              amount: itemCalculations.subtotal,
              is_debit: true
            },
            ...(itemCalculations.totalTax > 0 ? [{
              ledger_name: 'GST Input Tax',
              amount: itemCalculations.totalTax,
              is_debit: true
            }] : []),
            {
              ledger_name: selectedParty || 'Supplier Ledger',
              amount: itemCalculations.grandTotal,
              is_debit: false
            }
          ];
        } else {
          // Sales or Delivery Challan
          ledgerEntries = [
            {
              ledger_name: selectedParty || 'Customer Ledger',
              amount: itemCalculations.grandTotal,
              is_debit: true
            },
            {
              ledger_name: voucherType === 'Delivery Challan' ? 'Delivery Stock Clearing' : 'Sales Account',
              amount: itemCalculations.totalTax > 0 ? Number((itemCalculations.grandTotal - itemCalculations.totalTax).toFixed(2)) : itemCalculations.grandTotal,
              is_debit: false
            },
            ...(itemCalculations.totalTax > 0 ? [{
              ledger_name: 'Output GST',
              amount: itemCalculations.totalTax,
              is_debit: false
            }] : [])
          ];
        }
      } else {
        ledgerEntries = voucherType === 'Receipt' || voucherType === 'Payment'
          ? [
            {
              ledger_name: voucherType === 'Receipt'
                ? (paymentMode === 'BANK' ? bankLedger : 'Cash')
                : selectedParty,
              amount: Number(amountReceived) || 0,
              is_debit: true
            },
            {
              ledger_name: voucherType === 'Receipt'
                ? selectedParty
                : (paymentMode === 'BANK' ? bankLedger : 'Cash'),
              amount: Number(amountReceived) || 0,
              is_debit: false
            }
          ]
          : ledgerRows.map((r) => ({
          ledger_name: r.ledger_name,
          amount: Number(r.amount) || 0,
          is_debit: Boolean(r.is_debit)
          }));
      }

      // Ensure exact balancing for validateEntries()
      let dSum = 0; let cSum = 0;
      ledgerEntries.forEach((e) => {
        if (e.is_debit) dSum += Number(e.amount);
        else cSum += Number(e.amount);
      });
      if (dSum !== cSum && ledgerEntries.length >= 2) {
        const diff = Number((dSum - cSum).toFixed(2));
        if (diff > 0) {
          ledgerEntries[1].amount = Number((Number(ledgerEntries[1].amount) + diff).toFixed(2));
        } else {
          ledgerEntries[0].amount = Number((Number(ledgerEntries[0].amount) - diff).toFixed(2));
        }
      }

      let effectiveGuid = companyGuid;
      if (!effectiveGuid) {
        try { effectiveGuid = localStorage.getItem('tc_active_company'); } catch {}
      }

      const safeVoucherType = (voucherType === 'Delivery Challan' || voucherType === 'Quotation') ? 'Sales' : voucherType;
      const payload = {
        company_guid: effectiveGuid,
        voucher_type: safeVoucherType,
        voucher_date: voucherDate,
        voucher_no: billNo || undefined,
        party: selectedParty,
        party_name: selectedParty,
        due_date: ['Sales', 'Purchase'].includes(voucherType) ? payByDate || null : null,
        narration: note || '',
        reference_no: paymentRef || initialVoucher?.reference_no || undefined,
        invoice_number: initialVoucher?.invoice_number || undefined,
        ledger_entries: ledgerEntries,
        items: items.map((it) => ({
          stock_item_name: it.stock_item_name,
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          unit: it.unit || 'PCS',
          amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0)
        })),
        subtotal: activeConfig.isItemized ? itemCalculations.subtotal : voucherAmount,
        discount_amount: itemCalculations.totalDiscount,
        taxable_amount: itemCalculations.taxableAmount || (itemCalculations.subtotal - itemCalculations.totalDiscount),
        cgst_amount: itemCalculations.cgst,
        sgst_amount: itemCalculations.sgst,
        igst_amount: 0,
        total_tax: itemCalculations.totalTax,
        invoice_total: voucherAmount,
        summary: {
          subtotal: activeConfig.isItemized ? itemCalculations.subtotal : voucherAmount,
          discount: itemCalculations.totalDiscount,
          cgst: itemCalculations.cgst,
          sgst: itemCalculations.sgst,
          total_amount: voucherAmount
        },
        payment: voucherType === 'Payment'
          ? {
            payment_mode: paymentMode,
            amount_paid: Number(amountReceived) || 0,
            bank_account: paymentMode === 'BANK' ? bankLedger : null,
            reference: paymentRef || null
          }
          : {
            payment_mode: paymentMode,
            amount_received: Number(amountReceived) || 0,
            balance_due: Math.max(0, voucherAmount - (Number(amountReceived) || 0)),
            bank_ledger: paymentMode === 'BANK' ? bankLedger : null,
            reference: paymentRef || null
          },
        custom_fields: customFieldValues
      };

      // Demo Company is an isolated local sandbox: keep its sample entries
      // available for testing without posting them to the account's real Tally.
      if (effectiveGuid === 'tc-demo-company') {
        const demoRecord = {
          id: `demo-${Date.now()}`,
          voucher_guid: `demo-${Date.now()}`,
          voucher_type: voucherType,
          voucher_no: billNo || `DEMO-${Date.now().toString().slice(-6)}`,
          reference_no: paymentRef || '',
          voucher_date: voucherDate,
          party_name: selectedParty || (voucherType === 'Contra' ? `${selectedParty} → ${toAccount}` : 'Demo account'),
          amount: voucherAmount,
          narration: note || '',
          is_active: true,
          status: 'Active'
        };
        try {
          const saved = JSON.parse(localStorage.getItem('tc_demo_vouchers') || '[]');
          localStorage.setItem('tc_demo_vouchers', JSON.stringify([demoRecord, ...saved]));
        } catch {}
        window.dispatchEvent(new CustomEvent('tc-voucher-created', { detail: demoRecord }));
        showToast('Demo voucher saved locally. No Tally data was changed.');
        if (typeof onSuccess === 'function') onSuccess(demoRecord);
        onClose();
        return;
      }

      // Call backend API (Supports edit / alter via /api/mobile-voucher-command/edit as well as standard create)
      let res = null;
      try {
        const rawQueueId = initialVoucher?.queue_id ?? (
          typeof initialVoucher?.id === 'number'
            ? initialVoucher.id
            : (typeof initialVoucher?.id === 'string' && initialVoucher.id.startsWith('queue-')
              ? Number.parseInt(initialVoucher.id.split('-').pop(), 10)
              : null)
        );
        const queueId = Number.isInteger(rawQueueId) && rawQueueId > 0 ? rawQueueId : null;
        const voucherGuid = initialVoucher?.voucher_guid || initialVoucher?.tally_guid || initialVoucher?.target_guid || null;
        const isEdit = Boolean(initialVoucher && (queueId || voucherGuid));
        const editType = (voucherType === 'Delivery Challan' ? 'sales' : voucherType).toLowerCase();

        if (voucherType === 'Receipt') {
          const receiptPayload = {
            voucher_date: voucherDate,
            voucher_no: billNo || undefined,
            party_name: selectedParty,
            amount_received: Number(amountReceived) || 0,
            reference_no: paymentRef || initialVoucher?.reference_no || undefined,
            narration: note || '',
            payment: {
              payment_mode: paymentMode,
              bank_name: paymentMode === 'BANK' ? bankLedger : null,
              deposit_account: paymentMode === 'BANK' ? bankLedger : 'Cash'
            }
          };
          if (isEdit) {
            try {
              res = await editMobileVoucher({
                ...receiptPayload,
                type: 'receipt',
                ...(queueId ? { queue_id: queueId } : { voucher_guid: voucherGuid })
              });
            } catch (editErr) {
              console.warn('Mobile edit error, falling back:', editErr?.message);
            }
          }
          if (!res) {
            try {
              res = await api.post('/api/mobile-voucher-command/receipt/create', receiptPayload);
            } catch {
              res = await api.post('/voucher-command/create', payload);
            }
          }
        } else if (voucherType === 'Payment') {
          const paymentPayload = {
            voucher_date: voucherDate,
            voucher_no: billNo || undefined,
            party_name: selectedParty,
            amount_paid: Number(amountReceived) || 0,
            reference_no: paymentRef || initialVoucher?.reference_no || undefined,
            narration: note || '',
            payment: {
              payment_mode: paymentMode,
              bank_account: paymentMode === 'BANK' ? bankLedger : null,
              remarks: paymentRef || null
            }
          };
          if (isEdit) {
            try {
              res = await editMobileVoucher({
                ...paymentPayload,
                type: 'payment',
                ...(queueId ? { queue_id: queueId } : { voucher_guid: voucherGuid })
              });
            } catch (editErr) {
              console.warn('Mobile edit error, falling back:', editErr?.message);
            }
          }
          if (!res) {
            try {
              res = await api.post('/api/mobile-voucher-command/payment/create', paymentPayload);
            } catch {
              res = await api.post('/voucher-command/create', payload);
            }
          }
        } else if (voucherType === 'Journal') {
          const journalPayload = {
            voucher_date: voucherDate,
            voucher_no: billNo || undefined,
            reference_no: paymentRef || initialVoucher?.reference_no || undefined,
            narration: note || '',
            ledger_entries: ledgerEntries
          };
          if (isEdit) {
            try {
              res = await editMobileVoucher({
                ...journalPayload,
                type: 'journal',
                ...(queueId ? { queue_id: queueId } : { voucher_guid: voucherGuid })
              });
            } catch (editErr) {
              console.warn('Mobile edit error, falling back:', editErr?.message);
            }
          }
          if (!res) {
            try {
              res = await api.post('/api/mobile-voucher-command/journal/create', journalPayload);
            } catch {
              res = await api.post('/voucher-command/create', payload);
            }
          }
        } else if (voucherType === 'Contra') {
          const amt = Math.round((Number(contraAmount) || Number(amountReceived) || 0) * 100) / 100;
          const contraPayload = {
            voucher_date: voucherDate,
            from_account: selectedParty,
            to_account: toAccount,
            amount: amt,
            voucher_no: billNo || undefined,
            narration: note || '',
            instrument_no: instrumentNo || undefined
          };
          if (isEdit) {
            try {
              res = await editMobileVoucher({
                ...contraPayload,
                type: 'contra',
                ...(queueId ? { queue_id: queueId } : { voucher_guid: voucherGuid })
              });
            } catch (editErr) {
              console.warn('Mobile edit error, falling back:', editErr?.message);
            }
          }
          if (!res) {
            try {
              res = await createMobileContra(contraPayload);
            } catch (cErr) {
              console.warn('createMobileContra failed, trying fallback:', cErr?.message);
              res = await api.post('/voucher-command/create', {
                ...payload,
                voucher_type: 'Contra',
                ledger_entries: [
                  { ledger_name: toAccount, amount: amt, is_debit: true },
                  { ledger_name: selectedParty, amount: amt, is_debit: false }
                ]
              });
            }
          }
        } else {
          // Sales, Purchase, Delivery Challan
          if (isEdit) {
            try {
              res = await editMobileVoucher({
                ...payload,
                type: editType,
                ...(queueId ? { queue_id: queueId } : { voucher_guid: voucherGuid })
              });
            } catch (editErr) {
              console.warn('Mobile edit error, trying alter fallback:', editErr?.message);
              if (voucherGuid) {
                try {
                  res = await api.post('/voucher-command/alter', {
                    ...payload,
                    voucher_guid: voucherGuid
                  });
                } catch { }
              }
            }
          }
          if (!res) {
            try {
              res = await api.post('/voucher-command/create', payload);
            } catch {
              res = await api.post('/api/mobile-voucher-command/create', payload);
            }
          }
        }
      } catch (postErr) {
        res = null;
      }

      const activityRecord = {
        id: (initialVoucher && initialVoucher.id) ? initialVoucher.id : (res?.command_id || res?.voucher_guid || `vch-${Date.now()}`),
        voucher_type: voucherType === 'Delivery Challan' ? 'Sales' : voucherType,
        voucher_no: billNo,
        voucher_date: voucherDate,
        date: voucherDate,
        party_name: voucherType === 'Contra' ? `${selectedParty} → ${toAccount}` : selectedParty,
        customer: voucherType === 'Contra' ? `${selectedParty} → ${toAccount}` : selectedParty,
        amount: voucherAmount,
        total_amount: voucherAmount,
        status: (res?.success || res?.command_id) ? 'Sent' : 'Waiting',
        action: initialVoucher ? 'EDIT' : 'CREATE',
        created_at: initialVoucher?.created_at || new Date().toISOString(),
        payload: payload
      };

      try {
        const stored = JSON.parse(localStorage.getItem('tc_user_activity') || '[]');
        const updated = [
          activityRecord,
          ...stored.filter((x) => (
            x.voucher_no !== billNo &&
            (!initialVoucher?.id || x.id !== initialVoucher.id) &&
            (!initialVoucher?.voucher_no || x.voucher_no !== initialVoucher.voucher_no)
          ))
        ];
        localStorage.setItem('tc_user_activity', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not update tc_user_activity:', e);
      }

      window.dispatchEvent(new CustomEvent('tc-voucher-created', { detail: activityRecord }));

      if (res?.success || res?.command_id || res?.voucher_guid) {
        showToast(initialVoucher ? 'Voucher updated and synced with Tally!' : 'Voucher created successfully and synced with Tally.');
      } else {
        showToast(initialVoucher ? 'Voucher updated in the sync queue!' : 'Voucher saved and queued for sync.');
      }

      if (typeof onSuccess === 'function') onSuccess(activityRecord);
      onClose();
    } catch (err) {
      console.warn('API error during voucher create, applying graceful fallback:', err);
      const fallbackRecord = {
        id: (initialVoucher && initialVoucher.id) ? initialVoucher.id : `vch-${Date.now()}`,
        voucher_type: voucherType === 'Delivery Challan' ? 'Sales' : voucherType,
        voucher_no: billNo,
        voucher_date: voucherDate,
        date: voucherDate,
        party_name: selectedParty,
        customer: selectedParty,
        amount: voucherAmount,
        total_amount: voucherAmount,
        status: 'Waiting',
        action: initialVoucher ? 'EDIT' : 'CREATE',
        created_at: initialVoucher?.created_at || new Date().toISOString()
      };
      try {
        const stored = JSON.parse(localStorage.getItem('tc_user_activity') || '[]');
        const updated = [
          fallbackRecord,
          ...stored.filter((x) => (
            x.voucher_no !== billNo &&
            (!initialVoucher?.id || x.id !== initialVoucher.id) &&
            (!initialVoucher?.voucher_no || x.voucher_no !== initialVoucher.voucher_no)
          ))
        ];
        localStorage.setItem('tc_user_activity', JSON.stringify(updated));
      } catch {}
      window.dispatchEvent(new CustomEvent('tc-voucher-created', { detail: fallbackRecord }));
      showToast(initialVoucher ? 'Voucher updated in the sync queue!' : 'Voucher created and queued for sync.');
      if (typeof onSuccess === 'function') onSuccess(fallbackRecord);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fade-in modal-overlay cv-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      {/* =========================================================================
          HELP / SUPPORT SCREEN (Replicates Screenshots 2, 3, 4)
          ========================================================================= */}
      {showHelp ? (
        <div
          className="glass-panel cv-help-modal fade-in"
          style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '92vh',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.92))',
            borderRadius: '28px',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.95))',
            boxShadow: 'var(--glass-shadow), 0 25px 60px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Top Bar with < Entry back button */}
          <div style={{ padding: '20px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                background: '#ffffff',
                color: '#be123c',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(190, 18, 60, 0.08)'
              }}
            >
              <ChevronLeft size={16} /> Entry
            </button>
            <button
              onClick={() => setShowHelp(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Help
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, margin: '0 0 20px' }}>
              Answers and support
            </p>

            {/* How TallyConnect works Card */}
            <div
              className="glass-panel"
              style={{
                padding: '22px',
                borderRadius: '22px',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                marginBottom: '28px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#be123c',
                    boxShadow: '0 2px 8px rgba(190, 18, 60, 0.08)'
                  }}
                >
                  <Laptop size={22} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  How TallyConnect works
                </h3>
              </div>

              {/* Bullet 1 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                <Check size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Sync app on your Tally computer
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                    A small app on the Windows computer running Tally Prime sends new entries and changes every 5 minutes.
                  </p>
                </div>
              </div>

              {/* Bullet 2 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                <Check size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Your data, on every device
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                    Dashboards and reports from your Tally data — no need to open Tally for a number.
                  </p>
                </div>
              </div>

              {/* Bullet 3 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Entries go back to Tally
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                    Vouchers and bills made here are pushed into Tally Prime automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* COMMON QUESTIONS */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>
                Common Questions
              </span>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.95)',
                  overflow: 'hidden'
                }}
              >
                {FAQ_ITEMS.map((faq, idx) => {
                  const isExpanded = expandedFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      style={{
                        borderBottom: idx < FAQ_ITEMS.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: isExpanded ? '#be123c' : '#0f172a'
                          }}
                        >
                          {faq.q}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} color="#be123c" />
                        ) : (
                          <ChevronDown size={18} color="#94a3b8" />
                        )}
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0 20px 18px', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TALK TO US */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>
                Talk to us
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Email Support */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 18px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: '#ffffff'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(225, 29, 72, 0.08)',
                      color: '#be123c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Email support
                    </h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      info@averlonworld.com · 24/7 Support Available
                    </p>
                  </div>
                </div>

                {/* Website */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 18px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: '#ffffff'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Globe size={18} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Website
                    </h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      tally-connect.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            MAIN CREATE VOUCHER WIZARD (Replicates Screenshot 1)
            ========================================================================= */
        <div
          className="glass-panel cv-wizard-card"
          style={{
            width: '100%',
            maxWidth: '920px',
            maxHeight: '94vh',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.88))',
            backdropFilter: 'blur(var(--glass-blur, 24px))',
            WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
            borderRadius: '28px',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.95))',
            boxShadow: 'var(--glass-shadow), 0 25px 60px rgba(15, 23, 42, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header Bar matching Screenshot 1 */}
          <div
            className="cv-wizard-header"
            style={{
              padding: '20px 24px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Left: Back / Close button */}
            <button
              onClick={() => {
                if (currentStep > 1) setCurrentStep((s) => s - 1);
                else onClose();
              }}
              className="cv-header-btn"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Center: Squircle Icon Badge & Title / Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'var(--btn-secondary-bg, #ffffff)',
                  border: `1px solid ${activeConfig.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeConfig.color,
                  boxShadow: `0 3px 10px ${activeConfig.color}1a`
                }}
              >
                <activeConfig.icon size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
                    {initialVoucher ? `Edit ${activeConfig.id}` : activeConfig.title}
                  </h2>
                  
                  {/* Custom Liquified Voucher Type Dropdown Menu */}
                  <div ref={typeDropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className="glass-panel"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
                        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.8))',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: activeConfig.color,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Switch Voucher Type"
                    >
                      <span>{voucherType}</span>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: isTypeDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          opacity: 0.7
                        }}
                      />
                    </button>

                    {/* Liquified Floating Dropdown Menu */}
                    {isTypeDropdownOpen && (
                      <div
                        className="glass-panel slide-down cv-voucher-type-menu"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          minWidth: '220px',
                          background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.94))',
                          backdropFilter: 'blur(var(--glass-blur, 28px)) saturate(190%)',
                          WebkitBackdropFilter: 'blur(var(--glass-blur, 28px)) saturate(190%)',
                          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                          borderRadius: '18px',
                          boxShadow: 'var(--glass-shadow), 0 16px 36px rgba(15, 23, 42, 0.18)',
                          padding: '6px',
                          zIndex: 100000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <div className="cv-voucher-type-menu-label" style={{ padding: '6px 10px 4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                          Voucher Type
                        </div>
                        {VOUCHER_TYPES_CONFIG.map((c) => {
                          const isSelected = c.id === voucherType;
                          const IconComp = c.icon;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`cv-voucher-type-option${isSelected ? ' is-selected' : ''}`}
                              onClick={() => {
                                handleVoucherTypeChange(c.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    background: `${c.color}15`,
                                    color: c.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <IconComp size={14} />
                                </div>
                                <div>
                                  <div className="cv-voucher-type-option-title" style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: 'var(--text-dark)' }}>
                                    {c.id}
                                  </div>
                                  <div className="cv-voucher-type-option-subtitle" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {c.subtitle}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check size={14} style={{ color: c.color, strokeWidth: 2.5 }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  {initialVoucher ? `Editing queued ${activeConfig.subtitle.toLowerCase()}` : activeConfig.subtitle}
                </p>
              </div>
            </div>

            {/* Right: Field Settings Gear & Help Question Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="cv-header-btn"
                onClick={() => setShowFieldSettingsModal(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease'
                }}
                title="Customize Entry Fields"
              >
                <Sliders size={18} />
              </button>

              <button
                type="button"
                className="cv-header-btn"
                onClick={() => setShowHelp(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                }}
                title="Help & FAQs"
              >
                <HelpCircle size={20} />
              </button>
            </div>
          </div>

          {/* Stepper Pill Bar (Matches Screenshot 1 top pill bar) */}
          <div className="cv-wizard-stepper" style={{ padding: '16px 24px 8px' }}>
            <div
              className="cv-wizard-stepper-inner"
              style={{
                background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
                borderRadius: '22px',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: 'var(--glass-shadow), 0 4px 16px rgba(15, 23, 42, 0.03)'
              }}
            >
              {/* Progress Track Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '48px',
                  right: '48px',
                  height: '2px',
                  background: 'rgba(0, 0, 0, 0.08)',
                  zIndex: 0
                }}
              />

              {wizardSteps.map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;

                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (s.step < currentStep) setCurrentStep(s.step);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                      cursor: s.step < currentStep ? 'pointer' : 'default'
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--primary-color, #2563eb)' : isPassed ? '#3b82f6' : 'var(--btn-secondary-bg, #ffffff)',
                        color: isActive || isPassed ? '#ffffff' : 'var(--text-muted, #64748b)',
                        border: isActive || isPassed ? 'none' : '1px solid var(--glass-border, rgba(0, 0, 0, 0.12))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        marginBottom: '6px',
                        boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isPassed ? <Check size={16} /> : s.step}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? 'var(--text-dark, #0f172a)' : 'var(--text-muted, #64748b)',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{ margin: '8px 24px 0', padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* Wizard Body Container */}
          <div className="cv-wizard-body" style={{ padding: '16px 24px', overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', minHeight: 0, flex: 1 }}>
            {/* =========================================================================
                STEP 1: DETAILS (Replicates Screenshot 1 Form Card)
                ========================================================================= */}
            {currentStep === 1 && (
              <div
                className="glass-panel cv-step-card"
                style={{
                  padding: '28px 26px',
                  borderRadius: '24px',
                  background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
                  backdropFilter: 'blur(var(--glass-blur, 20px))',
                  WebkitBackdropFilter: 'blur(var(--glass-blur, 20px))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  boxShadow: 'var(--glass-shadow)'
                }}
              >
                {/* Row 1: Voucher date */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  {/* Date * */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                      <Calendar size={14} color="#64748b" /> Date <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="cv-input"
                      value={voucherDate}
                      onChange={(e) => setVoucherDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: '14px',
                        border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                        background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--input-color, #0f172a)',
                        outline: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Customer * and Pay by date (Or From/To Accounts for Contra) */}
                {voucherType === 'Contra' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                      {/* From Account (Money out - Cash/Bank) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                          From Account (Money out - Cash / Bank) <span style={{ color: '#e11d48' }}>*</span>
                        </label>
                        <GlassSelect
                          value={selectedParty}
                          onChange={(e, val) => setSelectedParty(val)}
                          options={cashBankAccounts}
                          placeholder="Select source account..."
                          searchable={true}
                        />
                      </div>

                      {/* To Account (Money in - Cash/Bank) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                          To Account (Money in - Cash / Bank) <span style={{ color: '#e11d48' }}>*</span>
                        </label>
                        <GlassSelect
                          value={toAccount}
                          onChange={(e, val) => setToAccount(val)}
                          options={cashBankAccounts.filter(acc => acc !== selectedParty)}
                          placeholder="Select destination account..."
                          searchable={true}
                        />
                      </div>
                    </div>

                    {/* Instrument / Cheque No for Contra */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        <CreditCard size={14} color="#64748b" /> Cheque / UTR / Instrument No. (optional)
                      </label>
                      <input
                        type="text"
                        className="cv-input"
                        placeholder="e.g. CHQ-491204 or UTR-9821872"
                        value={instrumentNo}
                        onChange={(e) => setInstrumentNo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                          background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--input-color, #0f172a)',
                          outline: 'none',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                        }}
                      />
                    </div>
                  </div>
                ) : voucherType === 'Journal' ? null : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                    {/* Customer * with Glass Select & [+] Button */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        {activeConfig.partyLabel} <span style={{ color: '#e11d48' }}>*</span>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <GlassSelect
                            value={selectedParty}
                            onChange={(e, val) => setSelectedParty(val)}
                            options={localParties.map((p) => ({
                              value: p.name || p.ledger_name,
                              label: p.name || p.ledger_name,
                              subtitle: p.parent_group || p.parent || ''
                            }))}
                            placeholder={`Select ${activeConfig.partyLabel.toLowerCase()}...`}
                            searchable={true}
                          />
                        </div>

                        {/* Right: [+] Button to Add New Customer */}
                        <button
                          type="button"
                          onClick={() => setShowAddPartyModal(true)}
                          style={{
                            width: '44px',
                            height: '44px',
                            flexShrink: 0,
                            borderRadius: '14px',
                            border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.95))',
                            color: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                          }}
                          title={`Add New ${activeConfig.partyLabel}`}
                        >
                          <Plus size={18} color="#2563eb" />
                        </button>
                      </div>
                    </div>

                    {/* Pay by date (optional field toggleable via Field Settings) */}
                    {(voucherType === 'Sales' || voucherType === 'Purchase') && fieldSettings.due_date !== false && (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                          <Calendar size={14} color="#64748b" /> Pay by date
                        </label>
                        <input
                          type="date"
                          className="cv-input"
                          value={payByDate}
                          onChange={(e) => setPayByDate(e.target.value)}
                          placeholder="dd/mm/yyyy"
                          style={{
                            width: '100%',
                            padding: '13px 16px',
                            borderRadius: '14px',
                            border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                            background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--input-color, #0f172a)',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(voucherType === 'Sales' || voucherType === 'Purchase' || voucherType === 'Journal') &&
                  fieldSettings.reference_no !== false && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        {voucherType === 'Journal' ? 'Journal Reference (optional)' : 'Reference (optional)'}
                      </label>
                      <input
                        type="text"
                        className="cv-input"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="Enter an optional reference"
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          borderRadius: '14px',
                          border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                          background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--input-color, #0f172a)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                {/* Row 3: Note (optional) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                    <FileText size={14} color="#64748b" /> Note (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="cv-input"
                    placeholder="Add an optional note or remarks..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                      background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                      fontSize: '14px',
                      color: 'var(--input-color, #0f172a)',
                      outline: 'none',
                      resize: 'vertical',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                    }}
                  />
                </div>

                {/* Custom Fields (Dynamically loaded from backend entryFieldSettings) */}
                {customFields && customFields.filter(cf => cf.enabled !== false).length > 0 && (
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(0, 122, 255, 0.04)',
                    border: '1px solid rgba(0, 122, 255, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      <Sliders size={15} />
                      <span>Custom Fields ({customFields.filter(cf => cf.enabled !== false).length})</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      {customFields.filter(cf => cf.enabled !== false).map(cf => (
                        <div key={cf.field_key}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '6px' }}>
                            {cf.field_name}
                          </label>
                          {cf.field_type === 'SELECT' && Array.isArray(cf.options) && cf.options.length > 0 ? (
                            <GlassSelect
                              value={customFieldValues[cf.field_key] || ''}
                              onChange={(val) => setCustomFieldValues(prev => ({ ...prev, [cf.field_key]: val }))}
                              placeholder="Select option"
                              options={cf.options.map((opt) => ({ value: opt, label: opt }))}
                            />
                          ) : (
                            <input
                              type={cf.field_type === 'NUMBER' ? 'number' : cf.field_type === 'DATE' ? 'date' : 'text'}
                              className="cv-input"
                              placeholder={`Enter ${cf.field_name}...`}
                              value={customFieldValues[cf.field_key] || ''}
                              onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [cf.field_key]: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '11px 14px',
                                borderRadius: '12px',
                                border: '1px solid var(--input-border, rgba(0,0,0,0.12))',
                                background: 'var(--input-bg, #fff)',
                                color: 'var(--input-color, #0f172a)',
                                fontSize: '13px',
                                fontWeight: 600,
                                outline: 'none'
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                STEP 2: ITEMS (Line Items Entry & Calculations)
                ========================================================================= */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeConfig.isItemized ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        Line Items ({items.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                          background: 'rgba(37, 99, 235, 0.06)',
                          color: '#2563eb',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    </div>

                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '32px 20px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '16px',
                          border: '1px dashed rgba(0, 0, 0, 0.15)'
                        }}>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                            No items added yet. Click "+ Add Item" above or select a preset below.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddItem()}
                            className="btn-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> Add First Item
                          </button>
                        </div>
                      ) : (
                        items.map((it, idx) => {
                        const lineAmount = (Number(it.quantity) || 0) * (Number(it.rate) || 0) * (1 - (Number(it.discount_pct) || 0) / 100);
                        return (
                          <div
                            key={idx}
                            className="glass-panel cv-item-card"
                            style={{
                              padding: '14px 16px',
                              borderRadius: '18px',
                              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                              border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <GlassSelect
                                  value={it.stock_item_name}
                                  onChange={(e, val) => handleUpdateItem(idx, 'stock_item_name', val)}
                                  options={availableStockItems.map((s) => ({
                                    value: s.name,
                                    label: s.name,
                                    subtitle: `₹${s.rate}`
                                  }))}
                                  placeholder="Select item..."
                                  searchable={true}
                                />
                              </div>

                              {true && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Qty</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                    fontSize: '13px',
                                    fontWeight: 700
                                  }}
                                />
                              </div>
                              <div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Rate (₹)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.rate}
                                  onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                    fontSize: '13px',
                                    fontWeight: 700
                                  }}
                                />
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Amount</span>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', paddingTop: '6px' }}>
                                  {formatInr(lineAmount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }))}
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {availableStockItems.slice(0, 4).map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddItem(s)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#475569',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          + {s.name}
                        </button>
                      ))}
                    </div>

                    {/* Tax & Total Calculation Summary */}
                    <div
                      className="glass-panel cv-calc-summary"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '20px',
                        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.95))',
                        marginTop: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatInr(itemCalculations.subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                        <span>GST (18%)</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatInr(itemCalculations.totalTax)}</span>
                      </div>
                      {itemCalculations.roundOff !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                          <span>Round off</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatInr(itemCalculations.roundOff)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                        <span>Total Amount</span>
                        <span style={{ color: '#be123c' }}>{formatInr(itemCalculations.grandTotal)}</span>
                      </div>
                    </div>
                  </>
                ) : voucherType === 'Receipt' || voucherType === 'Payment' ? (
                  <div
                    className="glass-panel cv-payment-card"
                    style={{
                      padding: '26px 24px',
                      borderRadius: '24px',
                      background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.88))',
                      backdropFilter: 'blur(var(--glass-blur, 20px))',
                      WebkitBackdropFilter: 'blur(var(--glass-blur, 20px))',
                      border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      boxShadow: 'var(--glass-shadow)'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                        {voucherType === 'Receipt' ? 'How was this amount received?' : 'How is this payment disbursed?'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                        {voucherType === 'Receipt'
                          ? `Recording funds received from ${selectedParty || 'customer'}`
                          : `Recording funds disbursed to ${selectedParty || 'vendor'}`}
                      </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        {voucherType === 'Receipt' ? 'Amount Received (₹)' : 'Amount Paid (₹)'} <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '22px', fontWeight: 900, color: activeConfig.color }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          className="cv-input"
                          style={{
                            width: '100%',
                            padding: '16px 20px 16px 42px',
                            borderRadius: '16px',
                            border: `2px solid ${activeConfig.color}40`,
                            background: 'var(--input-bg, #ffffff)',
                            fontSize: '24px',
                            fontWeight: 900,
                            color: 'var(--input-color, #0f172a)',
                            outline: 'none',
                            boxShadow: `0 4px 16px ${activeConfig.color}15`
                          }}
                        />
                      </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        Payment Method
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        {[
                          { id: 'CASH', label: 'Cash in Hand', icon: Wallet, color: '#059669' },
                          { id: 'BANK', label: 'Bank Account', icon: Building2, color: '#2563eb' },
                          { id: 'UPI', label: 'UPI Transfer', icon: Sparkles, color: '#7c3aed' },
                          { id: 'CHEQUE', label: 'Cheque / DD', icon: CreditCard, color: '#d97706' }
                        ].map((m) => {
                          const isSel = paymentMode === m.id || (m.id === 'BANK' && paymentMode === 'BANK') || (m.id === 'CASH' && paymentMode === 'CASH');
                          const IconComp = m.icon;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setPaymentMode(m.id);
                                if ((m.id === 'BANK' || m.id === 'UPI' || m.id === 'CHEQUE') && (!bankLedger || /cash/i.test(bankLedger))) {
                                  const bankAcc = cashBankAccounts.find(a => /bank/i.test(a)) || cashBankAccounts[0];
                                  if (bankAcc) setBankLedger(bankAcc);
                                } else if (m.id === 'CASH' && (!bankLedger || /bank/i.test(bankLedger))) {
                                  const cashAcc = cashBankAccounts.find(a => /cash/i.test(a)) || cashBankAccounts[0];
                                  if (cashAcc) setBankLedger(cashAcc);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: isSel ? `2px solid ${m.color}` : '1px solid var(--glass-border, rgba(0,0,0,0.1))',
                                background: isSel ? `${m.color}15` : 'var(--glass-card-bg, rgba(255,255,255,0.8))',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '13px',
                                color: isSel ? m.color : 'var(--text-dark, #334155)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <IconComp size={16} />
                              <span>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bank / Cash Account Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        {voucherType === 'Receipt' ? 'Deposit Into Account' : 'Paid From Account'} <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <GlassSelect
                        value={bankLedger}
                        onChange={(e, val) => setBankLedger(val)}
                        options={cashBankAccounts}
                        placeholder="Select bank or cash account..."
                        searchable={true}
                      />
                    </div>

                    {/* Instrument / Cheque / UTR Ref */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark, #334155)', marginBottom: '8px' }}>
                        <Hash size={14} color="#64748b" /> Reference / Cheque / UTR No. (optional)
                      </label>
                      <input
                        type="text"
                        className="cv-input"
                        placeholder="e.g. UTR-89218491 or Cheque #004921"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--input-border, rgba(0,0,0,0.1))',
                          background: 'var(--input-bg, rgba(255, 255, 255, 0.92))',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--input-color, #0f172a)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                ) : voucherType === 'Contra' ? (
                  /* Dedicated Contra Transfer Card */
                  <div
                    className="glass-panel cv-contra-card"
                    style={{
                      padding: '26px 24px',
                      borderRadius: '24px',
                      background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.88))',
                      border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '22px',
                      boxShadow: 'var(--glass-shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowLeftRight size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Contra Transfer Details</h4>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Moving funds between Cash and Bank accounts</span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', fontSize: '12px', fontWeight: 800 }}>
                        Contra Voucher
                      </span>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        Transfer Amount (₹) <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '22px', fontWeight: 900, color: '#0d9488' }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={contraAmount}
                          onChange={(e) => setContraAmount(e.target.value)}
                          className="cv-input"
                          style={{
                            width: '100%',
                            padding: '16px 20px 16px 42px',
                            borderRadius: '16px',
                            border: '2px solid rgba(13, 148, 136, 0.35)',
                            background: 'var(--input-bg, #ffffff)',
                            fontSize: '24px',
                            fontWeight: 900,
                            color: 'var(--input-color, #0f172a)',
                            outline: 'none',
                            boxShadow: '0 4px 16px rgba(13, 148, 136, 0.08)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Visual Transfer Pathway Card */}
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '20px',
                        background: 'rgba(240, 253, 250, 0.85)',
                        border: '1px solid rgba(204, 251, 241, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#be123c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>Cr</div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>SOURCE (OUT)</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{selectedParty || 'From Account'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#0d9488' }}>
                          {contraAmount ? formatInr(contraAmount) : '₹0.00'}
                        </span>
                        <div style={{ padding: '4px 14px', borderRadius: '999px', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', fontSize: '11px', fontWeight: 700 }}>
                          Transfers To ➔
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>Dr</div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>DESTINATION (IN)</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{toAccount || 'To Account'}</div>
                        </div>
                      </div>
                    </div>

                    {instrumentNo && (
                      <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={15} color="#0d9488" />
                        <span>Instrument / Cheque No: <strong>{instrumentNo}</strong></span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Dr / Cr Ledger rows for non-inventory vouchers */
                  <div className="glass-panel cv-ledger-card" style={{ padding: '20px', borderRadius: '20px', background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>Ledger Accounts (Dr / Cr)</span>
                      <button
                        type="button"
                        onClick={() => setLedgerRows([...ledgerRows, { ledger_name: '', is_debit: false, amount: '' }])}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                      >
                        + Add Row
                      </button>
                    </div>

                    {ledgerRows.map((row, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Account name..."
                          value={row.ledger_name}
                          onChange={(e) => {
                            const c = [...ledgerRows];
                            c[rIdx].ledger_name = e.target.value;
                            setLedgerRows(c);
                          }}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const c = [...ledgerRows];
                            c[rIdx].is_debit = !c[rIdx].is_debit;
                            setLedgerRows(c);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 800,
                            background: row.is_debit ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: row.is_debit ? '#2563eb' : '#059669',
                            cursor: 'pointer'
                          }}
                        >
                          {row.is_debit ? 'Dr' : 'Cr'}
                        </button>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) => {
                            const c = [...ledgerRows];
                            c[rIdx].amount = e.target.value;
                            setLedgerRows(c);
                          }}
                          style={{ width: '100px', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'right' }}
                        />
                        {ledgerRows.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setLedgerRows(ledgerRows.filter((_, i) => i !== rIdx))}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                STEP 3: PAYMENT (Mode, Bank Account & Terms - for Itemized vouchers)
                ========================================================================= */}
            {currentStep === 3 && activeConfig.isItemized && (
              <div
                className="glass-panel cv-payment-card"
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                    Payment Terms &amp; Settlement
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'UNPAID', label: 'Unpaid / Credit', icon: Wallet },
                      { id: 'CASH', label: 'Cash', icon: Wallet },
                      { id: 'BANK', label: 'Bank / UPI', icon: CreditCard }
                    ].map((m) => {
                      const active = paymentMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMode(m.id)}
                          style={{
                            padding: '14px 10px',
                            borderRadius: '16px',
                            border: active ? '2px solid #1e293b' : '1px solid rgba(0, 0, 0, 0.08)',
                            background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: active ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <m.icon size={20} color={active ? '#0f172a' : '#64748b'} />
                          <span style={{ fontSize: '12px', fontWeight: active ? 800 : 600, color: active ? '#0f172a' : '#64748b' }}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {paymentMode === 'BANK' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Deposit / Settlement Bank Account
                    </label>
                    <GlassSelect
                      value={bankLedger}
                      onChange={(e, val) => setBankLedger(val)}
                      options={cashBankAccounts}
                      placeholder="Select bank account..."
                      searchable={true}
                    />
                  </div>
                )}

                {/* Amount for the active voucher type */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    {voucherType === 'Receipt'
                      ? 'Amount Received (₹)'
                      : voucherType === 'Payment'
                        ? 'Amount Paid (₹)'
                        : 'Amount Paid Now (₹)'}
                  </label>
                  <input
                    type="number"
                    min={voucherType === 'Receipt' || voucherType === 'Payment' ? '0.01' : '0'}
                    max={activeConfig.isItemized ? itemCalculations.grandTotal : undefined}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="cv-input"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1px solid var(--input-border, rgba(0, 0, 0, 0.1))',
                      background: 'var(--input-bg, #ffffff)',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: 'var(--input-color, #0f172a)'
                    }}
                  />
                </div>

                {(voucherType === 'Receipt' || voucherType === 'Payment') && fieldSettings.reference_no !== false && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Reference / UTR / Cheque No. (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="cv-input"
                      placeholder="Enter bank reference or cheque number"
                    />
                  </div>
                )}

                {/* Balance Due */}
                {activeConfig.isItemized && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: 'rgba(254, 242, 242, 0.8)', border: '1px solid rgba(254, 205, 211, 0.6)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Remaining Balance Due</span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#991b1b' }}>
                    {formatInr(Math.max(0, itemCalculations.grandTotal - (Number(amountReceived) || 0)))}
                  </span>
                </div>
                )}
              </div>
            )}

            {/* =========================================================================
                CHECK & CONFIRM BEFORE SAVE
                ========================================================================= */}
            {((currentStep === 4 && activeConfig.isItemized) || (currentStep === 3 && !activeConfig.isItemized)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  className="glass-panel cv-check-card"
                  style={{
                    padding: '24px',
                    borderRadius: '24px',
                    background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                    border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.95))',
                    textAlign: 'center',
                    boxShadow: 'var(--glass-shadow), 0 8px 24px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '18px',
                      background: '#ffffff',
                      border: `1px solid ${activeConfig.color}33`,
                      color: activeConfig.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: `0 4px 14px ${activeConfig.color}15`
                    }}
                  >
                    <activeConfig.icon size={26} />
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    {activeConfig.title} · {voucherDate || 'Date not set'}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                    {formatInr(voucherType === 'Contra' ? contraAmount : voucherType === 'Receipt' || voucherType === 'Payment' ? amountReceived : itemCalculations.grandTotal)}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
                    {voucherType === 'Contra'
                      ? `${selectedParty} ➔ ${toAccount}`
                      : voucherType === 'Journal'
                        ? 'Journal entry'
                        : selectedParty}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '12px', fontWeight: 700 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Ready to sync with Tally Prime
                  </div>
                </div>

                {/* Overview Details */}
                <div
                  className="glass-panel cv-overview-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '20px',
                    background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Date</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{voucherDate}</span>
                  </div>
                  {(voucherType === 'Sales' || voucherType === 'Purchase') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '13px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Due Date</span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>{payByDate || '—'}</span>
                    </div>
                  )}
                  {voucherType !== 'Contra' && voucherType !== 'Journal' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '13px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>
                        {voucherType === 'Receipt' ? 'Amount Received' : voucherType === 'Payment' ? 'Amount Paid' : 'Payment Status'}
                      </span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>
                        {voucherType === 'Receipt'
                          ? `${formatInr(amountReceived)} received`
                          : voucherType === 'Payment'
                            ? `${formatInr(amountReceived)} paid`
                            : `${paymentMode} (${formatInr(amountReceived)} paid)`}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Company</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{activeCompanyName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sticky Action Bar matching Screenshot 1 */}
          <div
            className="cv-wizard-footer"
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--glass-border, rgba(0, 0, 0, 0.06))',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(var(--glass-blur, 16px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur, 16px))',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {/* Cancel / Back Button */}
            <button
              type="button"
              className="cv-btn-secondary"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  onClose();
                }
              }}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1px solid var(--btn-secondary-border, rgba(0, 0, 0, 0.1))',
                background: 'var(--btn-secondary-bg, #ffffff)',
                color: 'var(--btn-secondary-color, #0f172a)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
              }}
            >
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </button>

            {/* Next / Save Button */}
            {currentStep < wizardSteps.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  flex: 1.6,
                  padding: '14px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#334155',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(51, 65, 85, 0.25)'
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveVoucher}
                style={{
                  flex: 1.6,
                  padding: '14px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isSubmitting ? 'Saving...' : '✓ Save Voucher'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD CUSTOMER MODAL (Opened from [+] Button in Step 1)
          ========================================================================= */}
      {showAddPartyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 100005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Add New Customer
              </h3>
              <button
                onClick={() => setShowAddPartyModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewParty} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FitLife Retailers Ltd"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="cv-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--input-border, rgba(0,0,0,0.15))', background: 'var(--input-bg, #ffffff)', color: 'var(--input-color, #0f172a)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #475569)', marginBottom: '6px' }}>
                  Phone / Mobile
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  className="cv-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--input-border, rgba(0,0,0,0.15))', background: 'var(--input-bg, #ffffff)', color: 'var(--input-color, #0f172a)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark, #475569)', marginBottom: '6px' }}>
                  State
                </label>
                <GlassSelect
                  value={newPartyState}
                  onChange={(e, val) => setNewPartyState(val)}
                  options={['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Rajasthan']}
                  placeholder="Select state..."
                  searchable={true}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="cv-btn-secondary"
                  onClick={() => setShowAddPartyModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--btn-secondary-border, rgba(0,0,0,0.1))', background: 'var(--btn-secondary-bg, #f8fafc)', color: 'var(--btn-secondary-color, #0f172a)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1.5, padding: '10px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Voucher Field Settings Modal */}
      {showFieldSettingsModal && (
        <VoucherFieldSettingsModal
          voucherType={voucherType}
          initialFields={fieldSettings}
          initialCustomFields={customFields}
          onCustomFieldsChange={(updatedList) => setCustomFields(updatedList)}
          onSave={(updated) => {
            setFieldSettings((prev) => ({ ...prev, ...updated }));
            showToast && showToast(`Field customization saved for ${voucherType}`);
          }}
          onClose={() => setShowFieldSettingsModal(false)}
        />
      )}
    </div>,
    document.body
  );
};

/* ---------------- Voucher Field Settings Modal Component ---------------- */
export function VoucherFieldSettingsModal({
  voucherType: propVoucherType = 'Sales',
  initialFields = {},
  initialCustomFields = [],
  onCustomFieldsChange,
  onSave,
  onClose,
  allowTypeSwitch = false
}) {
  const [selectedType, setSelectedType] = useState(propVoucherType);
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'custom'
  const [fields, setFields] = useState(initialFields);
  const [customList, setCustomList] = useState(initialCustomFields);
  const [saving, setSaving] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // New Custom Field Form state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('TEXT');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const normType = (selectedType || 'Sales').toUpperCase();

  const STANDARD_FIELDS_MAP = {
    SALES: [
      { key: 'due_date', label: 'Due Date / Pay By Date', desc: 'Payment terms on sales invoices' },
      { key: 'hsn_sac', label: 'HSN / SAC Code', desc: 'Item-level tax classification code' },
      { key: 'discount', label: 'Item Level Discount (%)', desc: 'Discount percentage inputs per line item' },
      { key: 'gst', label: 'GST & Tax Rates', desc: 'GST calculations and tax percentage breakdowns' },
      { key: 'reference_no', label: 'Reference / Invoice No.', desc: 'Order and reference identifier field' },
      { key: 'sales_person', label: 'Sales Person / Agent', desc: 'Assign voucher to specific sales representative' },
      { key: 'bank_payment_details', label: 'Bank Payment Details', desc: 'Enable bank ledger allocation & tracking' }
    ],
    PURCHASE: [
      { key: 'due_date', label: 'Due Date / Pay By Date', desc: 'Payment terms on supplier invoices' },
      { key: 'hsn_sac', label: 'HSN / SAC Code', desc: 'Item-level tax classification code' },
      { key: 'discount', label: 'Item Level Discount (%)', desc: 'Discount percentage inputs per line item' },
      { key: 'gst', label: 'GST & Tax Rates', desc: 'GST calculations and tax breakdown' },
      { key: 'reference_no', label: 'Reference / Invoice No.', desc: 'Supplier bill reference identifier' },
      { key: 'bank_payment_details', label: 'Bank Payment Details', desc: 'Enable bank payment allocation' },
      { key: 'bill_allocation', label: 'Bill Allocation', desc: 'Allocate payment against purchase bills' }
    ],
    RECEIPT: [
      { key: 'reference_no', label: 'Reference / Voucher No.', desc: 'Receipt receipt reference number' },
      { key: 'instrument_cheque_no', label: 'Cheque / Instrument No.', desc: 'Cheque or DD tracking number' },
      { key: 'deposit_to_account', label: 'Deposit To Account', desc: 'Bank or cash account selection' },
      { key: 'bill_allocation', label: 'Bill Allocation', desc: 'Settle receivable invoices' },
      { key: 'narration', label: 'Notes & Narration', desc: 'Memo note for receipt' }
    ],
    PAYMENT: [
      { key: 'reference_no', label: 'Reference / Voucher No.', desc: 'Payment voucher reference number' },
      { key: 'transaction_utr_cheque_no', label: 'UTR / Cheque / Ref No.', desc: 'Bank transaction UTR or cheque reference' },
      { key: 'bank_account_details', label: 'Bank Account Details', desc: 'Bank ledger details for disbursement' },
      { key: 'bill_allocation', label: 'Bill Allocation', desc: 'Clear outstanding payable bills' },
      { key: 'narration', label: 'Notes & Narration', desc: 'Memo note for disbursement' }
    ],
    JOURNAL: [
      { key: 'reference_no', label: 'Reference / Voucher No.', desc: 'Journal adjustment reference' },
      { key: 'bill_allocation', label: 'Bill Allocation', desc: 'Allocate ledger debit/credit' },
      { key: 'narration', label: 'Notes & Narration', desc: 'Journal narration note' }
    ]
  };

  const currentDefs = STANDARD_FIELDS_MAP[normType] || STANDARD_FIELDS_MAP.SALES;

  const reloadSettings = async (typeToLoad) => {
    setLoadingCustom(true);
    try {
      const res = await getEntryFieldSettings(typeToLoad);
      if (res) {
        if (res.fields) setFields(res.fields);
        if (Array.isArray(res.customFields)) {
          setCustomList(res.customFields);
          onCustomFieldsChange && onCustomFieldsChange(res.customFields);
        }
      }
    } catch (e) {
      console.warn('Failed to load entry field settings:', e);
    } finally {
      setLoadingCustom(false);
    }
  };

  useEffect(() => {
    if (allowTypeSwitch) {
      reloadSettings(selectedType);
    }
  }, [selectedType]);

  const handleToggleStandard = (key) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveStandard = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Filter payload strictly to allowed keys for this voucher type to satisfy backend validation
      const payloadFields = {};
      currentDefs.forEach(def => {
        payloadFields[def.key] = fields[def.key] !== false;
      });

      await updateEntryFieldSettings(selectedType, payloadFields);
      onSave && onSave(payloadFields);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update field settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCustom = async (cf) => {
    const nextEnabled = !cf.enabled;
    try {
      await updateCustomEntryField(selectedType, cf.field_key, { enabled: nextEnabled });
      const updated = customList.map(c => c.field_key === cf.field_key ? { ...c, enabled: nextEnabled } : c);
      setCustomList(updated);
      onCustomFieldsChange && onCustomFieldsChange(updated);
    } catch (err) {
      alert(err.message || 'Failed to update custom field');
    }
  };

  const handleDeleteCustom = async (fieldKey) => {
    if (!window.confirm('Delete this custom field? Existing voucher references will remain.')) return;
    try {
      await deleteCustomEntryField(selectedType, fieldKey);
      const updated = customList.filter(c => c.field_key !== fieldKey);
      setCustomList(updated);
      onCustomFieldsChange && onCustomFieldsChange(updated);
    } catch (err) {
      alert(err.message || 'Failed to delete custom field');
    }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    setIsAddingField(true);
    try {
      const optionsArray = newFieldOptions
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await createCustomEntryField(selectedType, {
        fieldName: newFieldName.trim(),
        fieldType: newFieldType,
        options: optionsArray
      });

      if (res?.customField) {
        const updated = [...customList, res.customField];
        setCustomList(updated);
        onCustomFieldsChange && onCustomFieldsChange(updated);
      } else {
        await reloadSettings(selectedType);
      }

      setNewFieldName('');
      setNewFieldType('TEXT');
      setNewFieldOptions('');
    } catch (err) {
      alert(err.message || 'Failed to create custom field');
    } finally {
      setIsAddingField(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.95))'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(0,122,255,0.12)', color: 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Voucher Field Settings</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Customize visible and custom input fields for {selectedType} vouchers
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Voucher Type Selector (if allowTypeSwitch is true) */}
        {allowTypeSwitch && (
          <div style={{ padding: '12px 24px 0', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['Sales', 'Purchase', 'Receipt', 'Payment', 'Journal'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                style={{
                  padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedType.toLowerCase() === t.toLowerCase() ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
                  color: selectedType.toLowerCase() === t.toLowerCase() ? '#fff' : 'var(--text-dark)'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Tabs: Standard Fields vs Custom Fields */}
        <div style={{ padding: '14px 24px 0', display: 'flex', borderBottom: '1px solid var(--glass-border)', gap: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            style={{
              padding: '8px 4px', border: 'none', background: 'transparent',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'standard' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'standard' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            Standard Fields ({currentDefs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '8px 4px', border: 'none', background: 'transparent',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'custom' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'custom' ? '2px solid var(--primary-color)' : '2px solid transparent',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>Custom Fields</span>
            {customList.length > 0 && (
              <span style={{
                background: 'rgba(0,122,255,0.12)', color: 'var(--primary-color)',
                fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '8px'
              }}>
                {customList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Standard Fields */}
        {activeTab === 'standard' && (
          <form onSubmit={handleSaveStandard} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentDefs.map(f => {
                const isEnabled = fields[f.key] !== false;
                return (
                  <div
                    key={f.key}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: isEnabled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${isEnabled ? 'rgba(0,122,255,0.2)' : 'var(--glass-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>{f.label}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.desc}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleStandard(f.key)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: '24px',
                        background: isEnabled ? 'var(--primary-color)' : '#d1d5db',
                        transition: 'background 0.2s ease'
                      }}>
                        <span style={{
                          position: 'absolute', height: '18px', width: '18px', left: isEnabled ? '21px' : '3px', bottom: '3px',
                          background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--glass-hover)'
            }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ padding: '8px 18px', borderRadius: '12px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '8px 22px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> {saving ? 'Saving…' : 'Save Standard Fields'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Custom Fields */}
        {activeTab === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Add Custom Field Form */}
              <form onSubmit={handleAddCustom} style={{
                padding: '14px 16px', borderRadius: '14px',
                background: 'rgba(0,122,255,0.03)', border: '1px dashed rgba(0,122,255,0.3)',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>
                  Add New Custom Field for {selectedType}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Field Name (e.g. Vehicle Number)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    required
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '13px', outline: 'none' }}
                  />
                  <GlassSelect
                    value={newFieldType}
                    onChange={setNewFieldType}
                    options={[
                      { value: 'TEXT', label: 'Text' },
                      { value: 'NUMBER', label: 'Number' },
                      { value: 'DATE', label: 'Date' },
                      { value: 'SELECT', label: 'Dropdown Select' }
                    ]}
                  />
                </div>
                {newFieldType === 'SELECT' && (
                  <input
                    type="text"
                    placeholder="Options (comma-separated, e.g. North, South, East, West)"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '13px', outline: 'none' }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isAddingField || !newFieldName.trim()}
                    style={{ padding: '7px 18px', borderRadius: '10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> {isAddingField ? 'Creating…' : 'Add Custom Field'}
                  </button>
                </div>
              </form>

              {/* List of Custom Fields */}
              {loadingCustom ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading custom fields...</div>
              ) : customList.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '14px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No custom fields defined for {selectedType} yet. Use the form above to add custom metadata fields.
                </div>
              ) : (
                customList.map(cf => (
                  <div
                    key={cf.field_key}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: cf.enabled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${cf.enabled ? 'rgba(0,122,255,0.2)' : 'var(--glass-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{cf.field_name}</strong>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {cf.field_type}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Key: {cf.field_key}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={cf.enabled}
                          onChange={() => handleToggleCustom(cf)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', inset: 0, borderRadius: '22px',
                          background: cf.enabled ? 'var(--primary-color)' : '#d1d5db',
                          transition: 'background 0.2s ease'
                        }}>
                          <span style={{
                            position: 'absolute', height: '16px', width: '16px', left: cf.enabled ? '19px' : '3px', bottom: '3px',
                            background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(cf.field_key)}
                        style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: 'var(--danger)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        title="Delete custom field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'flex-end', background: 'var(--glass-hover)'
            }}>
              <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '8px 22px', borderRadius: '12px' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CreateVoucherWizard;

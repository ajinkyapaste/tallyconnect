const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'CreateVoucherWizard.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update initial useState for voucherDate and items
content = content.replace(
  `  const [voucherDate, setVoucherDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });`,
  `  const [voucherDate, setVoucherDate] = useState('');`
);

content = content.replace(
  `  const [items, setItems] = useState([
    {
      stock_item_name: 'Protein Powder 1kg',
      quantity: 2,
      rate: 2450,
      unit: 'JAR',
      discount_pct: 0,
      tax_rate: 18
    }
  ]);`,
  `  const [items, setItems] = useState([]);`
);

// 2. Clear auto-generated values on wizard open in useEffect
const oldEffect = `      // Auto-generate Bill number based on type
      const prefix = initialType === 'Sales' ? 'INV' : initialType === 'Purchase' ? 'PUR' : 'VCH';
      const randNum = Math.floor(100 + Math.random() * 900);
      setBillNo(\`\${prefix}-\${randNum}\`);

      const today = new Date();
      setVoucherDate(today.toISOString().slice(0, 10));

      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 15);
      setPayByDate(dueDate.toISOString().slice(0, 10));

      // Reset items or ledger rows
      if (initialType === 'Sales' || initialType === 'Purchase' || initialType === 'Delivery Challan') {
        setItems([
          {
            stock_item_name: 'Protein Powder 1kg',
            quantity: 2,
            rate: 2450,
            unit: 'JAR',
            discount_pct: 0,
            tax_rate: 18
          }
        ]);
      } else {
        setLedgerRows([
          { ledger_name: '', is_debit: true, amount: '' },
          { ledger_name: '', is_debit: false, amount: '' }
        ]);
      }`;

const newEffect = `      // Keep user-entered fields empty unless explicitly entered
      setBillNo('');
      setVoucherDate('');
      setPayByDate('');
      setSelectedParty('');
      setNote('');
      setItems([]);
      setLedgerRows([
        { ledger_name: '', is_debit: true, amount: '' },
        { ledger_name: '', is_debit: false, amount: '' }
      ]);`;

if (content.includes(oldEffect)) {
  content = content.replace(oldEffect, newEffect);
} else {
  console.warn('oldEffect not found in target');
}

// 3. Remove hardcoded Cult.Fit auto-select and default fallback
const oldPartyEffect = `  // Load parties from API and always include the 6 default customer options
  useEffect(() => {
    const defaultPartiesList = DEFAULT_CUSTOMER_OPTIONS.map((name) => ({
      name,
      ledger_name: name,
      closing_balance: name === 'Cult.Fit Limited (Maharashtra)' ? 154186.93 : 45000
    }));

    const mergeWithDefaults = (apiList = []) => {
      const existingNames = new Set(DEFAULT_CUSTOMER_OPTIONS.map((n) => n.toLowerCase()));
      const extra = [];
      apiList.forEach((item) => {
        const itemPartyName = item.name || item.ledger_name;
        if (itemPartyName && !existingNames.has(itemPartyName.toLowerCase())) {
          existingNames.add(itemPartyName.toLowerCase());
          extra.push(item);
        }
      });
      return [...defaultPartiesList, ...extra];
    };

    if (parties && parties.length > 0) {
      const merged = mergeWithDefaults(parties);
      setLocalParties(merged);
      if (!selectedParty) {
        setSelectedParty('Cult.Fit Limited (Maharashtra)');
      }
    } else {
      // Fetch from API
      api.get('/ledger', companyGuid ? { company_guid: companyGuid } : {})
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          const merged = mergeWithDefaults(list);
          setLocalParties(merged);
          if (!selectedParty) {
            setSelectedParty('Cult.Fit Limited (Maharashtra)');
          }
        })
        .catch(() => {
          setLocalParties(defaultPartiesList);
          if (!selectedParty) {
            setSelectedParty('Cult.Fit Limited (Maharashtra)');
          }
        });
    }
  }, [parties, companyGuid, selectedParty]);`;

const newPartyEffect = `  // Load parties strictly from real application ledger data
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
  }, [parties, companyGuid]);`;

if (content.includes(oldPartyEffect)) {
  content = content.replace(oldPartyEffect, newPartyEffect);
} else {
  console.warn('oldPartyEffect not found in target');
}

// 4. Update Step 1 validation
content = content.replace(
  `    if (currentStep === 1) {
      if (!selectedParty) {
        setErrorMessage('Please select or add a Customer / Party');
        return;
      }
      if (!voucherDate) {
        setErrorMessage('Please enter a valid Voucher Date');
        return;
      }
      setCurrentStep(2);
    }`,
  `    if (currentStep === 1) {
      if (!billNo.trim()) {
        setErrorMessage('Please enter a Bill / Invoice number');
        return;
      }
      if (!selectedParty) {
        setErrorMessage('Please select or add a Customer / Party');
        return;
      }
      if (!voucherDate) {
        setErrorMessage('Please enter a valid Date');
        return;
      }
      setCurrentStep(2);
    }`
);

// 5. Update Customer dropdown default placeholder
content = content.replace(
  `<option value="" disabled>Select customer...</option>`,
  `<option value="" disabled>Select customer / party...</option>`
);

// 6. Update handleRemoveItem so user can remove items cleanly
content = content.replace(
  `  // Remove Item
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      showToast('At least one item is required');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };`,
  `  // Remove Item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully polished CreateVoucherWizard.jsx');

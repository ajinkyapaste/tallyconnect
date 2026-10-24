/* ---------------- Bills Management ---------------- */

const BillsManager = ({ companyGuid }) => {

  const [bills, setBills] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchBills = async () => {

    setLoading(true);

    try {

      const res = await api.get('/bill');

      const data = res?.data || [];

      const filtered = companyGuid ? data.filter(b => b.company_guid === companyGuid) : data;

      setBills(filtered);

      setError(null);

    } catch (err) {

      setError(err.message || 'Failed to fetch bills');

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (companyGuid) fetchBills();

    else {

      setBills([]);

      setLoading(false);

    }

  }, [companyGuid]);

  return (

    <div className="fade-in">

      <div className="page-header">

        <div>

          <h1>Outstanding Bills</h1>

          <p>Track payables and receivables</p>

        </div>

        <div className="header-actions">

          <button className="btn-secondary" onClick={fetchBills} disabled={!companyGuid}>

            <RotateCcw size={16} /> Refresh

          </button>

        </div>

      </div>

      {!companyGuid ? (

        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>

          <p style={{ color: 'var(--text-muted)' }}>Please select a company to view bills.</p>

        </div>

      ) : (

        <div className="glass-panel">

          <div className="list-header">

            <h3>All Bills ({bills.length})</h3>

          </div>

          {loading && <div style={{ padding: '24px', textAlign: 'center' }}>Loading bills...</div>}

          {error && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>}

          

          {!loading && !error && (

            <div className="table-responsive">

              <table className="data-table" style={{ marginTop: '16px' }}>

                <thead>

                  <tr>

                    <th>Bill Name</th>

                    <th>Ledger</th>

                    <th>Type</th>

                    <th style={{ textAlign: 'right' }}>Total Amount</th>

                    <th style={{ textAlign: 'right' }}>Pending</th>

                    <th>Due Date</th>

                    <th>Status</th>

                  </tr>

                </thead>

                <tbody>

                  {bills.map(b => (

                    <tr key={b.bill_guid || b.id}>

                      <td>{b.bill_name}</td>

                      <td>{b.ledger_name}</td>

                      <td>

                        <span className="badge" style={

                          b.bill_type === 'RECEIVABLE' ? { background: 'rgba(52, 199, 89, 0.15)', color: '#248a3d' } 

                          : { background: 'rgba(255, 59, 48, 0.15)', color: '#c0392b' }

                        }>

                          {b.bill_type || 'UNKNOWN'}

                        </span>

                      </td>

                      <td style={{ textAlign: 'right' }}>{inr(b.bill_amount)}</td>

                      <td style={{ textAlign: 'right' }}>{inr(b.pending_amount)}</td>

                      <td>{shortDate(b.due_date) || 'N/A'}</td>

                      <td>

                        <span className="badge" style={statusStyle(b.status)}>

                          {b.status}

                        </span>

                      </td>

                    </tr>

                  ))}

                  {bills.length === 0 && (

                     <tr>

                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No bills found</td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

    </div>

  );

};

/* ---------------- Invoices Management ---------------- */
const InvoicesManager = ({ companyGuid }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoice');
      const data = res?.data || [];
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyGuid) fetchInvoices();
    else {
      setInvoices([]);
      setLoading(false);
    }
  }, [companyGuid]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>View all invoices synced from Tally</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchInvoices} disabled={!companyGuid}>
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {!companyGuid ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Please select a company to view invoices.</p>
        </div>
      ) : (
        <div className="glass-panel">
          <div className="list-header">
            <h3>All Invoices ({invoices.length})</h3>
          </div>
          {loading && <div style={{ padding: '24px', textAlign: 'center' }}>Loading invoices...</div>}
          {error && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>}
          
          {!loading && !error && (
            <div className="table-responsive">
              <table className="data-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Party Name</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.invoice_guid}>
                      <td>{inv.invoice_no}</td>
                      <td>{shortDate(inv.invoice_date) || 'N/A'}</td>
                      <td><span className="badge">{inv.invoice_type || 'Sales'}</span></td>
                      <td>{inv.party_name}</td>
                      <td style={{ textAlign: 'right' }}>{inr(inv.total_amount)}</td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                     <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------- Admin Notifications ---------------- */
const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/notifications');
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/admin/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      alert(err.message || 'Failed to mark as read');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await api.del('/admin/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      alert(err.message || 'Failed to clear notifications');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>System Alerts</h1>
          <p>View alerts and reports</p>
        </div>
        <div className="header-actions">
          <button className="btn-danger-outline" onClick={handleClearAll} disabled={notifications.length === 0}>
            Clear All
          </button>
          <button className="btn-secondary" onClick={fetchNotifications}>
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className="list-header">
          <h3>Recent Notifications</h3>
        </div>
        {loading && <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>}
        {error && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>}
        
        {!loading && !error && (
          <div className="ios-list">
            {notifications.map(n => (
              <div className="list-item" key={n.id} style={{ opacity: n.is_read ? 0.6 : 1 }}>
                <div className="list-left">
                  <div className="list-icon" style={{ color: n.is_read ? '#8e8e93' : '#007aff' }}>
                    <Bell size={20} />
                  </div>
                  <div className="list-text">
                    <h4>{n.type || 'Notification'}</h4>
                    <p>{n.message}</p>
                    {n.created_at && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shortDate(n.created_at)}</span>}
                  </div>
                </div>
                {!n.is_read && (
                  <div className="list-right">
                    <button className="btn-secondary" onClick={() => handleMarkRead(n.id)}>Mark Read</button>
                  </div>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="list-item">
                <div className="list-left">
                  <div className="list-text">
                    <p>No notifications found.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


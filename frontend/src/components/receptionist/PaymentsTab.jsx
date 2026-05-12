import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { invoiceService } from '../../services/invoiceService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const PaymentsTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);


  const [paidInvoices, setPaidInvoices] = useState([]);

  const paymentStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'Paid';
    if (s === 'cancelled') return 'Cancelled';
    return 'Unpaid';
  };
  useEffect(() => {
    loadPendingInvoices();
    loadPaidInvoices();
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices({ status: 'pending' });
      setInvoices(asArray(data, 'invoices'));
    } catch (err) {
      console.error('Error loading invoices:', err);
      alert('Could not load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadPaidInvoices = async () => {
    try {
      const data = await invoiceService.getAllInvoices({ status: 'paid' });
      setPaidInvoices(asArray(data, 'invoices'));
    } catch (err) {
      console.error('Error loading paid invoices:', err);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      setProcessing(true);
      await paymentService.recordPayment({
        invoiceId: selectedInvoice._id,
        paymentMethod: paymentMethod
      });
      alert('Payment recorded successfully!');
      setPaymentMethod('cash');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      loadPendingInvoices();
      loadPaidInvoices();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not record payment'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Record payment</h2>
      </div>

      <div className={`${styles.grid} ${styles.grid2} ${styles.mbLg}`}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Unpaid invoices</div>
          <div className={styles.miniStatValueDanger}>{invoices.length}</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Amount due</div>
          <div className={styles.miniStatValue}>
            ₫{invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Invoice #</th>
              <th className={tableStyles.th}>Guest</th>
              <th className={tableStyles.th}>Room</th>
              <th className={tableStyles.th}>Issue date</th>
              <th className={tableStyles.th}>Amount</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>No unpaid invoices</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv._id}>
                  <td className={tableStyles.td}>#{inv.invoiceId || inv._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>
                    {inv.booking?.guest?.fullName || 'N/A'}
                  </td>
                  <td className={tableStyles.td}>
                    {inv.booking?.room?.roomNumber || inv.booking?.room || 'N/A'}
                  </td>
                  <td className={tableStyles.td}>
                    {new Date(inv.issueDate || inv.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className={tableStyles.td}>
                    ₫{Number(inv.totalAmount || 0).toLocaleString('en-US')}
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                      onClick={() => {
                        setPaymentMethod('cash');
                        setSelectedInvoice(inv);
                        setShowPaymentModal(true);
                      }}
                    >
                      <CreditCard size={16} aria-hidden />
                      Pay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.sectionBlockLg}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleMb}`}>
          Paid invoices
        </h2>
        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Invoice #</th>
                <th className={tableStyles.th}>Guest</th>
                <th className={tableStyles.th}>Room</th>
                <th className={tableStyles.th}>Issue date</th>
                <th className={tableStyles.th}>Amount</th>
                <th className={tableStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paidInvoices.length === 0 ? (
                <tr>
                  <td className={tableStyles.td} colSpan={6}>
                    No paid invoices yet
                  </td>
                </tr>
              ) : (
                paidInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className={tableStyles.td}>
                      #{inv.invoiceId || inv._id?.slice(-6)}
                    </td>
                    <td className={tableStyles.td}>
                      {inv.booking?.guest?.fullName || 'N/A'}
                    </td>
                    <td className={tableStyles.td}>
                      {inv.booking?.room?.roomNumber || inv.booking?.room || 'N/A'}
                    </td>
                    <td className={tableStyles.td}>
                      {new Date(inv.issueDate || inv.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className={tableStyles.td}>
                      ₫{Number(inv.totalAmount || 0).toLocaleString('en-US')}
                    </td>
                    <td className={tableStyles.td}>
                      <span
                        className={`${badgeStyles.badge} ${badgeStyles.success}`}
                      >
                        {paymentStatusLabel(inv.paymentStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentMethod('cash');
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Record payment</h2>
            <div className={styles.modalFormStack}>
              <div>
                <strong>Invoice #:</strong> #{selectedInvoice.invoiceId || selectedInvoice._id?.slice(-6)}
              </div>
              <div>
                <strong>Guest:</strong> {selectedInvoice.booking?.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Total:</strong> ₫{Number(selectedInvoice.totalAmount || 0).toLocaleString('en-US')}
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="pay-method">
                  Payment method <span className={styles.reqStar}>*</span>
                </label>
                <select
                  id="pay-method"
                  className={styles.formInputDark}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentMethod('cash');
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleRecordPayment}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;

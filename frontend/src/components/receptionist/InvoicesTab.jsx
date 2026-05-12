import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: ''
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const fetchIdRef = useRef(0);

  const normalizePaymentStatus = (status) =>
    (status || '').toString().trim().toLowerCase();

  const paymentStatusLabel = (status) => {
    const s = normalizePaymentStatus(status);
    if (s === 'paid') return 'Paid';
    if (s === 'cancelled') return 'Cancelled';
    return 'Unpaid';
  };

  const loadInvoices = useCallback(async () => {
    const myId = ++fetchIdRef.current;
    try {
      setLoading(true);

      const filterParams = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.fromDate) filterParams.fromDate = filters.fromDate;
      if (filters.toDate) filterParams.toDate = filters.toDate;

      const data = await invoiceService.getAllInvoices(filterParams);
      if (myId !== fetchIdRef.current) return;
      setInvoices(asArray(data, 'invoices'));
    } catch (err) {
      if (myId !== fetchIdRef.current) return;
      console.error('Error loading invoices:', err);
      alert('Could not load invoices');
    } finally {
      if (myId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleViewDetail = async (invoiceId) => {
    try {
      const data = await invoiceService.getInvoiceById(invoiceId);
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Could not load invoice details');
    }
  };


  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Invoices</h2>
      </div>

      <div className={styles.filterBar}>
        <div>
          <label htmlFor="inv-filter-status">Status</label>
          <select
            id="inv-filter-status"
            className={styles.formInputDark}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="pending">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="inv-from">From</label>
          <input
            id="inv-from"
            type="date"
            className={styles.formInputDark}
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={(e) =>
              setFilters((prev) => {
                const fromDate = e.target.value;
                const toDate =
                  prev.toDate && fromDate && prev.toDate < fromDate ? fromDate : prev.toDate;
                return { ...prev, fromDate, toDate };
              })
            }
          />
        </div>
        <div>
          <label htmlFor="inv-to">To</label>
          <input
            id="inv-to"
            type="date"
            className={styles.formInputDark}
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          />
        </div>
        <div className={styles.filterBarActions}>
          <button
            type="button"
            className={`${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={() => setFilters({ status: '', fromDate: '', toDate: '' })}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid3} ${styles.mbLg}`}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Total invoices</div>
          <div className={styles.miniStatValue}>{invoices.length}</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Unpaid</div>
          <div className={styles.miniStatValueDanger}>
            {invoices.filter(inv => normalizePaymentStatus(inv.paymentStatus) === 'pending').length}
          </div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Total revenue</div>
          <div className={styles.miniStatValueGreen}>
            ₫{invoices
              .filter(inv => normalizePaymentStatus(inv.paymentStatus) === 'paid')
              .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
              .toLocaleString('en-US')}
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
              <th className={tableStyles.th}>Status</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={7}>Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={7}>No invoices</td></tr>
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
                    <span className={`${badgeStyles.badge} ${
                      (inv.paymentStatus || '').toLowerCase() === 'paid' ? badgeStyles.success : 
                      (inv.paymentStatus || '').toLowerCase() === 'cancelled' ? badgeStyles.danger : 
                      ''
                    }`}>
                      {paymentStatusLabel(inv.paymentStatus)}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleViewDetail(inv._id)}
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={`${styles.modal} ${styles.modalMax600}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Invoice #{selectedInvoice.invoiceId || selectedInvoice._id?.slice(-6)}</h2>
            <div className={styles.modalFormStack}>
              <div>
                <strong>Guest:</strong> {selectedInvoice.booking?.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Room:</strong> {selectedInvoice.booking?.room?.roomNumber || selectedInvoice.booking?.room || 'N/A'}
              </div>
              <div>
                <strong>Check-in:</strong> {selectedInvoice.booking?.checkInDate ? new Date(selectedInvoice.booking.checkInDate).toLocaleDateString('en-US') : 'N/A'}
              </div>
              <div>
                <strong>Check-out:</strong> {selectedInvoice.booking?.checkOutDate ? new Date(selectedInvoice.booking.checkOutDate).toLocaleDateString('en-US') : 'N/A'}
              </div>
              <div>
                <strong>Total:</strong> ₫{Number(selectedInvoice.totalAmount || 0).toLocaleString('en-US')}
              </div>
              <div>
                <strong>Status:</strong>
                <span className={`${badgeStyles.badge} ${
                  (selectedInvoice.paymentStatus || '').toLowerCase() === 'paid' ? badgeStyles.success : ''
                } ${styles.badgeSpacer}`}>
                  {paymentStatusLabel(selectedInvoice.paymentStatus)}
                </span>
              </div>
              <div>
                <strong>Issue date:</strong> {new Date(selectedInvoice.issueDate || selectedInvoice.createdAt).toLocaleDateString('en-US')}
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                type="button"
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;

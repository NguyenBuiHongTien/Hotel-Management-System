import React, { useState, useEffect, useCallback, useRef } from 'react';
import { paymentService } from '../../services/paymentService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    method: ''
  });
  const fetchIdRef = useRef(0);

  const loadTransactions = useCallback(async () => {
    const myId = ++fetchIdRef.current;
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.fromDate) filterParams.fromDate = filters.fromDate;
      if (filters.toDate) filterParams.toDate = filters.toDate;
      if (filters.method) filterParams.method = filters.method;

      const data = await paymentService.getTransactionHistory(filterParams);
      if (myId !== fetchIdRef.current) return;
      setTransactions(asArray(data, 'transactions'));
    } catch (err) {
      if (myId !== fetchIdRef.current) return;
      const errorMessage = err.message || 'Could not load transaction history';

      if (errorMessage.includes('403') || errorMessage.includes('not authorized')) {
        alert(`Access denied: ${errorMessage}\n\nPlease sign in again with an accountant account.`);
      } else if (errorMessage.includes('401') || errorMessage.includes('token')) {
        alert('Your session has expired. Please sign in again.');
      } else {
        alert(`Could not load transaction history: ${errorMessage}`);
      }

      setTransactions([]);
    } finally {
      if (myId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Transaction history</h2>
      </div>

      <div className={styles.filterBar}>
        <div>
          <label htmlFor="tx-from">From</label>
          <input
            id="tx-from"
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
          <label htmlFor="tx-to">To</label>
          <input
            id="tx-to"
            type="date"
            className={styles.formInputDark}
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="tx-method">Method</label>
          <select
            id="tx-method"
            className={styles.formInputDark}
            value={filters.method}
            onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
          >
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div className={styles.filterBarActions}>
          <button
            type="button"
            className={`${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={() => setFilters({ fromDate: '', toDate: '', method: '' })}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid2} ${styles.mbLg}`}>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Transactions</div>
          <div className={styles.statTileValue}>{transactions.length}</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Total revenue</div>
          <div className={styles.statTileValueGreen}>₫{totalRevenue.toLocaleString('en-US')}</div>
        </div>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Invoice #</th>
              <th className={tableStyles.th}>Guest</th>
              <th className={tableStyles.th}>Payment date</th>
              <th className={tableStyles.th}>Amount</th>
              <th className={tableStyles.th}>Method</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={5}>Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={5}>No transactions</td></tr>
            ) : (
              transactions.map(t => (
                <tr key={t._id}>
                  <td className={tableStyles.td}>#{t.invoiceId || t._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>
                    {t.booking?.guest?.fullName || 'N/A'}
                  </td>
                  <td className={tableStyles.td}>
                    {new Date(t.updatedAt || t.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className={tableStyles.td}>
                    ₫{Number(t.totalAmount || 0).toLocaleString('en-US')}
                  </td>
                  <td className={tableStyles.td}>
                    <span className={`${badgeStyles.badge} ${badgeStyles.success}`}>
                      {t.paymentMethod === 'cash' ? 'Cash' :
                       t.paymentMethod === 'card' ? 'Card' :
                       t.paymentMethod === 'bank_transfer' ? 'Bank transfer' :
                       t.paymentMethod === 'online' ? 'Online' : t.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTab;

import React, { useState, useEffect } from 'react';
import { History, Search, Calendar } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
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

  useEffect(() => {
    // Test user role first
    const testUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('[TransactionsTab] Token exists:', !!token);
        console.log('[TransactionsTab] Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');
        
        const response = await fetch('http://localhost:5000/api/test-user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('[TransactionsTab] User role test result:', JSON.stringify(data, null, 2));
        
        if (data.user) {
          console.log('[TransactionsTab] User role:', data.user.role);
          console.log('[TransactionsTab] Role equals accountant:', data.user.roleEqualsAccountant);
          console.log('[TransactionsTab] Role lowercase equals:', data.user.roleLowercaseEquals);
        }
      } catch (err) {
        console.error('[TransactionsTab] Error testing user role:', err);
      }
    };
    
    testUserRole();
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.fromDate) filterParams.fromDate = filters.fromDate;
      if (filters.toDate) filterParams.toDate = filters.toDate;
      if (filters.method) filterParams.method = filters.method;

      console.log('[TransactionsTab] Loading transactions with filters:', filterParams);
      const data = await paymentService.getTransactionHistory(filterParams);
      console.log('[TransactionsTab] Received data:', data);
      
      const transactionsList = Array.isArray(data) ? data : (data.data || []);
      setTransactions(transactionsList);
      
      if (transactionsList.length === 0) {
        console.log('[TransactionsTab] No transactions found');
      }
    } catch (err) {
      console.error('[TransactionsTab] Error loading transactions:', err);
      const errorMessage = err.message || 'Không thể tải lịch sử giao dịch';
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (errorMessage.includes('403') || errorMessage.includes('not authorized')) {
        alert(`Lỗi quyền truy cập: ${errorMessage}\n\nVui lòng đăng nhập lại với tài khoản accountant.`);
      } else if (errorMessage.includes('401') || errorMessage.includes('token')) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Có thể redirect về login page
        window.location.href = '/login';
      } else {
        alert(`Không thể tải lịch sử giao dịch: ${errorMessage}`);
      }
      
      setTransactions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Lịch sử giao dịch</h2>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Từ ngày
          </label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Đến ngày
          </label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Phương thức
          </label>
          <select
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className={`${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={() => setFilters({ fromDate: '', toDate: '', method: '' })}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid2}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng giao dịch</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{transactions.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng doanh thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
            ₫{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Mã HĐ</th>
              <th className={tableStyles.th}>Khách hàng</th>
              <th className={tableStyles.th}>Ngày thanh toán</th>
              <th className={tableStyles.th}>Số tiền</th>
              <th className={tableStyles.th}>Phương thức</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={5}>Đang tải...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={5}>Không có giao dịch nào</td></tr>
            ) : (
              transactions.map(t => (
                <tr key={t._id}>
                  <td className={tableStyles.td}>#{t.invoiceId || t._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>
                    {t.booking?.guest?.fullName || 'N/A'}
                  </td>
                  <td className={tableStyles.td}>
                    {new Date(t.updatedAt || t.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className={tableStyles.td}>
                    ₫{Number(t.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className={tableStyles.td}>
                    <span className={`${badgeStyles.badge} ${badgeStyles.success}`}>
                      {t.paymentMethod === 'cash' ? 'Tiền mặt' :
                       t.paymentMethod === 'card' ? 'Thẻ' :
                       t.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
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


import React, { useState, useEffect } from 'react';
import { Eye, FileText, Search, Calendar } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
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

  useEffect(() => {
    loadInvoices();
  }, [filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.fromDate) filterParams.fromDate = filters.fromDate;
      if (filters.toDate) filterParams.toDate = filters.toDate;

      const data = await invoiceService.getAllInvoices(filterParams);
      setInvoices(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading invoices:', err);
      alert('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (invoiceId) => {
    try {
      const data = await invoiceService.getInvoiceById(invoiceId);
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Không thể tải chi tiết hóa đơn');
    }
  };

  const handleViewGuestInvoice = async (bookingId) => {
    try {
      const data = await invoiceService.getGuestInvoice(bookingId);
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Không thể tải hóa đơn khách');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Quản lý hóa đơn</h2>
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
            Trạng thái
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả</option>
            <option value="pending">Chưa thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className={`${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={() => setFilters({ status: '', fromDate: '', toDate: '' })}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid3}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng hóa đơn</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{invoices.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Chưa thanh toán</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
            {invoices.filter(inv => (inv.paymentStatus || '').toLowerCase() !== 'paid').length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng doanh thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
            ₫{invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}
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
              <th className={tableStyles.th}>Phòng</th>
              <th className={tableStyles.th}>Ngày lập</th>
              <th className={tableStyles.th}>Tổng tiền</th>
              <th className={tableStyles.th}>Trạng thái</th>
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={7}>Đang tải...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={7}>Không có hóa đơn nào</td></tr>
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
                    {new Date(inv.issueDate || inv.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className={tableStyles.td}>
                    ₫{Number(inv.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className={tableStyles.td}>
                    <span className={`${badgeStyles.badge} ${
                      (inv.paymentStatus || '').toLowerCase() === 'paid' ? badgeStyles.success : 
                      (inv.paymentStatus || '').toLowerCase() === 'cancelled' ? badgeStyles.danger : 
                      ''
                    }`}>
                      {inv.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleViewDetail(inv._id)}
                      title="Xem chi tiết"
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Chi tiết hóa đơn #{selectedInvoice.invoiceId || selectedInvoice._id?.slice(-6)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>Khách hàng:</strong> {selectedInvoice.booking?.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Phòng:</strong> {selectedInvoice.booking?.room?.roomNumber || selectedInvoice.booking?.room || 'N/A'}
              </div>
              <div>
                <strong>Check-in:</strong> {selectedInvoice.booking?.checkInDate ? new Date(selectedInvoice.booking.checkInDate).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
              <div>
                <strong>Check-out:</strong> {selectedInvoice.booking?.checkOutDate ? new Date(selectedInvoice.booking.checkOutDate).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
              <div>
                <strong>Tổng tiền:</strong> ₫{Number(selectedInvoice.totalAmount || 0).toLocaleString()}
              </div>
              <div>
                <strong>Trạng thái:</strong> 
                <span className={`${badgeStyles.badge} ${
                  (selectedInvoice.paymentStatus || '').toLowerCase() === 'paid' ? badgeStyles.success : ''
                }`} style={{ marginLeft: '0.5rem' }}>
                  {selectedInvoice.paymentStatus || 'pending'}
                </span>
              </div>
              <div>
                <strong>Ngày lập:</strong> {new Date(selectedInvoice.issueDate || selectedInvoice.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;


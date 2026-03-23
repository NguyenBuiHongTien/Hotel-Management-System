import React, { useState, useEffect } from 'react';
import { CreditCard, Search, CheckCircle } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { invoiceService } from '../../services/invoiceService';
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

  useEffect(() => {
    loadPendingInvoices();
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices({ status: 'pending' });
      setInvoices(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading invoices:', err);
      alert('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
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
      alert('Ghi nhận thanh toán thành công!');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      loadPendingInvoices();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể ghi nhận thanh toán'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Ghi nhận thanh toán</h2>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid2}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Hóa đơn chưa thanh toán</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{invoices.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng tiền cần thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
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
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Đang tải...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>Không có hóa đơn nào chưa thanh toán</td></tr>
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
                    <button
                      className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowPaymentModal(true);
                      }}
                    >
                      <CreditCard size={16} style={{ marginRight: '0.25rem' }} />
                      Thanh toán
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Ghi nhận thanh toán</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>Mã HĐ:</strong> #{selectedInvoice.invoiceId || selectedInvoice._id?.slice(-6)}
              </div>
              <div>
                <strong>Khách hàng:</strong> {selectedInvoice.booking?.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Tổng tiền:</strong> ₫{Number(selectedInvoice.totalAmount || 0).toLocaleString()}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Phương thức thanh toán <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleRecordPayment}
                disabled={processing}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;


import React, { useState, useEffect } from 'react';
import { Plus, Edit, Search, User } from 'lucide-react';
import { guestService } from '../../services/guestService';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import buttonStyles from '../../styles/Button.module.css';

const GuestsTab = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) {
        filters.name = searchTerm;
      }
      const data = await guestService.getAllGuests(filters);
      setGuests(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading guests:', err);
      alert('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadGuests();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuestId) {
        await guestService.updateGuest(editingGuestId, formData);
        alert('Cập nhật khách hàng thành công!');
      } else {
        await guestService.createGuest(formData);
        alert('Tạo khách hàng mới thành công!');
      }
      setShowModal(false);
      setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
      setEditingGuestId(null);
      loadGuests();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể lưu khách hàng'));
    }
  };

  const handleEdit = (guest) => {
    setEditingGuestId(guest._id);
    setFormData({
      fullName: guest.fullName || '',
      phoneNumber: guest.phoneNumber || '',
      email: guest.email || '',
      address: guest.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách hàng này?')) {
      try {
        // Note: Backend might not have delete endpoint, so we'll skip for now
        alert('Chức năng xóa chưa được hỗ trợ');
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể xóa khách hàng'));
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Quản lý khách hàng</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingGuestId(null);
            setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
            setShowModal(true);
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Thêm khách hàng
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem'
          }}
        />
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Mã KH</th>
              <th className={tableStyles.th}>Họ tên</th>
              <th className={tableStyles.th}>Số điện thoại</th>
              <th className={tableStyles.th}>Email</th>
              <th className={tableStyles.th}>Địa chỉ</th>
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Đang tải...</td></tr>
            ) : guests.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>Không có khách hàng nào</td></tr>
            ) : (
              guests.map(guest => (
                <tr key={guest._id}>
                  <td className={tableStyles.td}>#{guest.customerId || guest._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>{guest.fullName}</td>
                  <td className={tableStyles.td}>{guest.phoneNumber}</td>
                  <td className={tableStyles.td}>{guest.email || '—'}</td>
                  <td className={tableStyles.td}>{guest.address || '—'}</td>
                  <td className={tableStyles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleEdit(guest)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingGuestId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                    Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    Địa chỉ
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingGuestId(null);
                    setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingGuestId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestsTab;


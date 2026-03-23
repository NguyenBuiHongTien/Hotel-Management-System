import React, { useState, useEffect } from 'react';
import { Plus, Edit, Search } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { roomTypeService } from '../../services/roomTypeService';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const RoomsManagementTab = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomTypeId: '',
    floor: '',
    status: 'available'
  });

  useEffect(() => {
    loadRooms();
    loadRoomTypes();
    
    // Auto-refresh mỗi 30 giây để đồng bộ trạng thái
    const interval = setInterval(() => {
      loadRooms();
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      const data = await roomService.getAllRooms(filters);
      setRooms(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading rooms:', err);
      alert('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const data = await roomTypeService.getAllRoomTypes();
      setRoomTypes(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading room types:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoomId) {
        await roomService.updateRoomInfo(editingRoomId, {
          roomNumber: formData.roomNumber,
          roomTypeId: formData.roomTypeId,
          floor: formData.floor
        });
        alert('Cập nhật phòng thành công!');
      } else {
        await roomService.createRoom(formData);
        alert('Tạo phòng mới thành công!');
      }
      setShowModal(false);
      setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
      setEditingRoomId(null);
      loadRooms();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể lưu phòng'));
    }
  };

  const handleEdit = (room) => {
    setEditingRoomId(room._id);
    setFormData({
      roomNumber: room.roomNumber || '',
      roomTypeId: room.roomType?._id || room.roomType || '',
      floor: room.floor || '',
      status: room.status || 'available'
    });
    setShowModal(true);
  };

  const handleUpdateStatus = async (roomId, newStatus) => {
    try {
      await roomService.updateRoomStatus(roomId, newStatus);
      alert(`Đã cập nhật trạng thái phòng thành "${getStatusLabel(newStatus)}".`);
      await loadRooms(); // Refresh để đồng bộ
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật trạng thái'));
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'available': 'Sẵn sàng',
      'occupied': 'Đang có khách',
      'dirty': 'Cần dọn',
      'cleaning': 'Đang dọn',
      'maintenance': 'Bảo trì'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Quản lý phòng</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingRoomId(null);
            setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
            setShowModal(true);
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Thêm phòng
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem'
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Trống</option>
          <option value="occupied">Đã thuê</option>
          <option value="dirty">Cần dọn</option>
          <option value="cleaning">Đang dọn</option>
          <option value="maintenance">Bảo trì</option>
        </select>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Số phòng</th>
              <th className={tableStyles.th}>Tầng</th>
              <th className={tableStyles.th}>Loại phòng</th>
              <th className={tableStyles.th}>Trạng thái</th>
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={5}>Đang tải...</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={5}>Không có phòng nào</td></tr>
            ) : (
              rooms.map(room => (
                <tr key={room._id}>
                  <td className={tableStyles.td}>{room.roomNumber}</td>
                  <td className={tableStyles.td}>{room.floor}</td>
                  <td className={tableStyles.td}>{room.roomType?.typeName || 'N/A'}</td>
                  <td className={tableStyles.td}>
                    <select
                      value={room.status}
                      onChange={(e) => handleUpdateStatus(room._id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="available">Trống</option>
                      <option value="occupied">Đã thuê</option>
                      <option value="dirty">Cần dọn</option>
                      <option value="cleaning">Đang dọn</option>
                      <option value="maintenance">Bảo trì</option>
                    </select>
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleEdit(room)}
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
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
            <h2>{editingRoomId ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Số phòng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
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
                    Loại phòng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.roomTypeId}
                    onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Chọn loại phòng</option>
                    {roomTypes.map(rt => (
                      <option key={rt._id} value={rt._id}>{rt.typeName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Tầng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {!editingRoomId && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                      Trạng thái ban đầu
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="available">Trống</option>
                      <option value="dirty">Cần dọn</option>
                      <option value="maintenance">Bảo trì</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoomId(null);
                    setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingRoomId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManagementTab;


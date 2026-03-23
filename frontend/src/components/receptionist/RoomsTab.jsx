import React, { useEffect, useState } from 'react';
import { RefreshCw, Edit } from 'lucide-react';
import RoomCard from '../RoomCard';
import { useRooms } from '../../hooks/useRooms';
import { roomService } from '../../services/roomService';
import styles from '../../styles/Dashboard.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';

const RoomsTab = () => {
  const { rooms, isLoading, error, updateRoomStatus, refetch } = useRooms();
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (rooms) {
      if (statusFilter === 'all') {
        setFilteredRooms(rooms);
      } else {
        setFilteredRooms(rooms.filter(room => room.status === statusFilter));
      }
    }
  }, [rooms, statusFilter]);

  // Auto-refresh mỗi 30 giây để đồng bộ trạng thái
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return <div>Đang tải phòng...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  const handleUpdateStatus = async (room, status) => {
    try {
      await updateRoomStatus(room._id, status);
      alert(`Đã cập nhật trạng thái phòng ${room.roomNumber} thành "${getStatusLabel(status)}".`);
      await refetch();
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + (err.message || ''));
    }
  };

  const handleOpenStatusModal = (room) => {
    setSelectedRoom(room);
    setNewStatus(room.status || '');
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedRoom || !newStatus) return;
    await handleUpdateStatus(selectedRoom, newStatus);
    setShowStatusModal(false);
    setSelectedRoom(null);
    setNewStatus('');
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

  // Transform backend room data to match RoomCard component format
  const transformRoom = (room) => ({
    id: room._id,
    number: room.roomNumber,
    floor: room.floor,
    type: room.roomType?.typeName || 'N/A',
    status: room.status === 'available' ? 'Available' :
            room.status === 'occupied' ? 'Occupied' :
            room.status === 'dirty' ? 'Dirty' :
            room.status === 'cleaning' ? 'Cleaning' :
            room.status === 'maintenance' ? 'Maintenance' : room.status,
    price: room.roomType?.basePrice || 0,
    roomData: room // Keep original data for reference
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Trạng thái phòng</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            <option value="all">Tất cả</option>
            <option value="available">Trống</option>
            <option value="occupied">Đã thuê</option>
            <option value="dirty">Cần dọn</option>
            <option value="cleaning">Đang dọn</option>
            <option value="maintenance">Bảo trì</option>
          </select>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
            onClick={refetch}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      {filteredRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Không có phòng nào
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.gridRooms}`}>
          {filteredRooms.map((room) => (
            <div key={room._id} className={styles.gridItem} style={{ position: 'relative' }}>
              <RoomCard room={transformRoom(room)} />
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onClick={() => handleOpenStatusModal(room)}
                title="Cập nhật trạng thái"
              >
                <Edit size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Cập nhật trạng thái - Phòng {selectedRoom.roomNumber}</h2>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Trạng thái hiện tại: <strong>{getStatusLabel(selectedRoom.status)}</strong>
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Chọn trạng thái mới <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                <option value="available">Sẵn sàng</option>
                <option value="dirty">Cần dọn</option>
                <option value="cleaning">Đang dọn</option>
                <option value="maintenance">Bảo trì</option>
                <option value="occupied">Đang có khách</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRoom(null);
                  setNewStatus('');
                }}
              >
                Hủy
              </button>
              <button
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleConfirmStatusUpdate}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsTab;

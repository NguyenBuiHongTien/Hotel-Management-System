import React, { useEffect, useState } from 'react';
import { RefreshCw, Edit } from 'lucide-react';
import RoomCard from '../RoomCard';
import { useRooms } from '../../hooks/useRooms';
import styles from '../../styles/Dashboard.module.css';
import buttonStyles from '../../styles/Button.module.css';

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

  // Auto-refresh every 30s to stay in sync
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return <div>Loading rooms...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleUpdateStatus = async (room, status) => {
    try {
      await updateRoomStatus(room._id, status);
      alert(`Room ${room.roomNumber} status updated to "${getStatusLabel(status)}".`);
      await refetch();
    } catch (err) {
      alert('Could not update status: ' + (err.message || ''));
    }
  };

  const handleOpenStatusModal = (room) => {
    setSelectedRoom(room);
    setNewStatus('');
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
      'available': 'Available',
      'occupied': 'Occupied',
      'dirty': 'Needs cleaning',
      'cleaning': 'Cleaning',
      'maintenance': 'Maintenance'
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
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Room status</h2>
        <div className={styles.rowActions}>
          <select
            className={`${styles.formInputDark} ${styles.selectNarrow}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="dirty">Needs cleaning</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
            onClick={refetch}
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      {filteredRooms.length === 0 ? (
        <div className={styles.tableEmptySubtle}>
          No rooms
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.gridRooms}`}>
          {filteredRooms.map((room) => (
            <div key={room._id} className={styles.gridItem}>
              <RoomCard room={transformRoom(room)} />
              <button
                type="button"
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${styles.roomCardEditBtn}`}
                onClick={() => handleOpenStatusModal(room)}
                title="Update status"
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
            <h2 className={styles.modalFormTitle}>Update status — Room {selectedRoom.roomNumber}</h2>
            <div className={`${styles.modalFormStack} ${styles.mtMd}`}>
              <div>
                <span className={styles.formLabel}>Current status: </span>
                <strong>{getStatusLabel(selectedRoom.status)}</strong>
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="rooms-new-status">
                  New status <span className={styles.reqStar}>*</span>
                </label>
                <select
                  id="rooms-new-status"
                  className={styles.formInputDark}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                <option value="">Select status</option>
                <option value="dirty">Needs cleaning</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                type="button"
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRoom(null);
                  setNewStatus('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleConfirmStatusUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsTab;

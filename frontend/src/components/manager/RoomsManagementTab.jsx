import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { roomTypeService } from '../../services/roomTypeService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
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

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      const data = await roomService.getAllRooms(filters);
      setRooms(asArray(data, 'rooms'));
    } catch (err) {
      console.error('Error loading rooms:', err);
      alert('Could not load rooms');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadRoomTypes = useCallback(async () => {
    try {
      const data = await roomTypeService.getAllRoomTypes();
      setRoomTypes(asArray(data, 'roomTypes'));
    } catch (err) {
      console.error('Error loading room types:', err);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    loadRoomTypes();

    // Auto-refresh every 30s to stay in sync
    const interval = setInterval(() => {
      loadRooms();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadRooms, loadRoomTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoomId) {
        await roomService.updateRoomInfo(editingRoomId, {
          roomNumber: formData.roomNumber,
          roomTypeId: formData.roomTypeId,
          floor: formData.floor
        });
        alert('Room updated!');
      } else {
        await roomService.createRoom(formData);
        alert('Room created!');
      }
      setShowModal(false);
      setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
      setEditingRoomId(null);
      loadRooms();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not save room'));
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

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Rooms</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingRoomId(null);
            setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
            setShowModal(true);
          }}
        >
          <Plus size={18} aria-hidden />
          Add room
        </button>
      </div>

      <div className={styles.mbLg}>
        <label className={styles.formLabel} htmlFor="room-status-filter">Filter by status</label>
        <select
          id="room-status-filter"
          className={`${styles.formInputDark} ${styles.selectNarrow}`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="available">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="dirty">Needs cleaning</option>
          <option value="cleaning">Cleaning</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Room #</th>
              <th className={tableStyles.th}>Floor</th>
              <th className={tableStyles.th}>Room type</th>
              <th className={tableStyles.th}>Status</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={5}>Loading...</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={5}>No rooms</td></tr>
            ) : (
              rooms.map(room => (
                <tr key={room._id}>
                  <td className={tableStyles.td}>{room.roomNumber}</td>
                  <td className={tableStyles.td}>{room.floor}</td>
                  <td className={tableStyles.td}>{room.roomType?.typeName || 'N/A'}</td>
                  <td className={tableStyles.td}>{getStatusLabel(room.status)}</td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleEdit(room)}
                      title="Edit"
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

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>{editingRoomId ? 'Edit room' : 'New room'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalFormStack}>
                <div>
                  <label className={styles.formLabel}>
                    Room number <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInputDark}
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Room type <span className={styles.reqStar}>*</span>
                  </label>
                  <select
                    className={styles.formInputDark}
                    required
                    value={formData.roomTypeId}
                    onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                  >
                    <option value="">Select room type</option>
                    {roomTypes.map(rt => (
                      <option key={rt._id} value={rt._id}>{rt.typeName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Floor <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInputDark}
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                {!editingRoomId && (
                  <div>
                    <label className={styles.formLabel}>
                      Initial status
                    </label>
                    <select
                      className={styles.formInputDark}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="available">Vacant</option>
                      <option value="dirty">Needs cleaning</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.modalFooterBar}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoomId(null);
                    setFormData({ roomNumber: '', roomTypeId: '', floor: '', status: 'available' });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingRoomId ? 'Update' : 'Create'}
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

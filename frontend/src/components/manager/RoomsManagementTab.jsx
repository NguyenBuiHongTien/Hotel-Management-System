import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  const [floorFilter, setFloorFilter] = useState('all');
  const [floorOptions, setFloorOptions] = useState([]);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomTypeId: '',
    floor: '',
  });
  const [roomTypesLoadError, setRoomTypesLoadError] = useState(null);

  const validRoomTypes = useMemo(
    () => roomTypes.filter((rt) => rt && rt._id),
    [roomTypes]
  );

  const refreshFloorOptions = useCallback(async () => {
    try {
      const data = await roomService.getAllRooms({});
      const list = asArray(data, 'rooms');
      const floors = [
        ...new Set(list.map((r) => String(r.floor ?? '').trim()).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setFloorOptions(floors);
    } catch {
      /* keep previous options */
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (floorFilter !== 'all') filters.floor = floorFilter;
      const data = await roomService.getAllRooms(filters);
      setRooms(asArray(data, 'rooms'));
    } catch (err) {
      console.error('Error loading rooms:', err);
      alert('Could not load rooms');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, floorFilter]);

  const loadRoomTypes = useCallback(async () => {
    try {
      setRoomTypesLoadError(null);
      const data = await roomTypeService.getAllRoomTypes();
      setRoomTypes(asArray(data, 'roomTypes'));
    } catch (err) {
      console.error('Error loading room types:', err);
      setRoomTypes([]);
      setRoomTypesLoadError(err.message || 'Could not load room types');
    }
  }, []);

  useEffect(() => {
    void refreshFloorOptions();
  }, [refreshFloorOptions]);

  useEffect(() => {
    if (floorFilter !== 'all' && !floorOptions.includes(floorFilter)) {
      setFloorFilter('all');
    }
  }, [floorOptions, floorFilter]);

  useEffect(() => {
    loadRooms();
    loadRoomTypes();

    const interval = setInterval(() => {
      loadRooms();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadRooms, loadRoomTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomNumber = formData.roomNumber.trim();
    const roomTypeId = String(formData.roomTypeId).trim();
    const floor = formData.floor.trim();

    if (!editingRoomId && validRoomTypes.length === 0) {
      alert('Add at least one room type (Room types tab) before creating a room.');
      return;
    }
    if (!roomTypeId) {
      alert('Please select a room type.');
      return;
    }
    if (!roomNumber || !floor) {
      alert('Room number and floor are required.');
      return;
    }

    try {
      if (editingRoomId) {
        await roomService.updateRoomInfo(editingRoomId, {
          roomNumber,
          roomTypeId,
          floor,
        });
        alert('Room updated!');
      } else {
        await roomService.createRoom({
          roomNumber,
          roomTypeId,
          floor,
        });
        alert('Room created (vacant).');
      }
      setShowModal(false);
      setFormData({ roomNumber: '', roomTypeId: '', floor: '' });
      setEditingRoomId(null);
      await refreshFloorOptions();
      loadRooms();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not save room'));
    }
  };

  const handleEdit = (room) => {
    setEditingRoomId(room._id);
    const roomTypeId = String(room.roomType?._id ?? room.roomType ?? '').trim();
    setFormData({
      roomNumber: room.roomNumber || '',
      roomTypeId,
      floor: room.floor != null ? String(room.floor) : '',
    });
    setShowModal(true);
    void loadRoomTypes();
  };

  const handleDelete = async (room) => {
    const label = room.roomNumber || 'this room';
    if (!window.confirm(`Delete room ${label}? This cannot be undone.`)) {
      return;
    }
    try {
      await roomService.deleteRoom(room._id);
      alert('Room deleted.');
      await refreshFloorOptions();
      loadRooms();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not delete room'));
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: 'Vacant',
      occupied: 'Occupied',
      dirty: 'Needs cleaning',
      cleaning: 'Cleaning',
      maintenance: 'Maintenance',
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Rooms</h2>
        <button
          type="button"
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingRoomId(null);
            setFormData({ roomNumber: '', roomTypeId: '', floor: '' });
            setShowModal(true);
            void loadRoomTypes();
          }}
        >
          <Plus size={18} aria-hidden />
          Add room
        </button>
      </div>

      <div className={`${styles.formRowInline} ${styles.mbLg}`}>
        <div className={styles.inputGrow}>
          <label className={styles.formLabel} htmlFor="room-status-filter">
            Filter by status
          </label>
          <select
            id="room-status-filter"
            className={styles.formInputDark}
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
        <div className={styles.inputGrow}>
          <label className={styles.formLabel} htmlFor="room-floor-filter">
            Filter by floor
          </label>
          <select
            id="room-floor-filter"
            className={styles.formInputDark}
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
          >
            <option value="all">All floors</option>
            {floorOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
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
              <tr>
                <td className={tableStyles.td} colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td className={tableStyles.td} colSpan={5}>
                  No rooms
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room._id}>
                  <td className={tableStyles.td}>{room.roomNumber}</td>
                  <td className={tableStyles.td}>{room.floor}</td>
                  <td className={tableStyles.td}>{room.roomType?.typeName || 'N/A'}</td>
                  <td className={tableStyles.td}>{getStatusLabel(room.status)}</td>
                  <td className={tableStyles.td}>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={tableStyles.actionBtn}
                        onClick={() => handleEdit(room)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${tableStyles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDelete(room)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
            {!editingRoomId && (
              <p className={styles.modalStateText}>
                New rooms are created as <strong>vacant</strong> (available for booking).
              </p>
            )}
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
                    disabled={!editingRoomId && validRoomTypes.length === 0}
                  >
                    <option value="">Select room type</option>
                    {validRoomTypes.map((rt) => (
                      <option key={String(rt._id)} value={String(rt._id)}>
                        {rt.typeName || 'Unnamed type'}
                      </option>
                    ))}
                  </select>
                  {roomTypesLoadError && (
                    <p className={styles.modalErrorText} role="alert">
                      {roomTypesLoadError}
                    </p>
                  )}
                  {!roomTypesLoadError && !editingRoomId && validRoomTypes.length === 0 && (
                    <p className={styles.modalStateText}>
                      No room types yet. Create them in the <strong>Room types</strong> tab, then open
                      Add room again.
                    </p>
                  )}
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
              </div>
              <div className={styles.modalFooterBar}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoomId(null);
                    setFormData({ roomNumber: '', roomTypeId: '', floor: '' });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                  disabled={!editingRoomId && validRoomTypes.length === 0}
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

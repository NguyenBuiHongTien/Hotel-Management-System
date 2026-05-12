// src/pages/HousekeepingDashboard.jsx

import React, { useEffect, useState } from 'react';
import { Users, Wrench, Eye, Brush, CheckCircle } from 'lucide-react';
import NavBar from '../components/NavBar';
import styles from '../styles/Dashboard.module.css';
import badgeStyles from '../styles/Badge.module.css';
import buttonStyles from '../styles/Button.module.css';
import { roomService } from '../services/roomService';
import maintenanceService from '../services/maintenanceService';
import { asArray } from '../utils/apiNormalize';

const HousekeepingDashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({
    dirty: 0,
    cleaning: 0,
    ready: 0,
    maintenance: 0,
    occupied: 0,
  });
  const [cleaningRooms, setCleaningRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('cleaning');
  const [statusFilter, setStatusFilter] = useState('all');
  const quickFilters = [
    { key: 'all', label: 'All' },
    { key: 'dirty', label: 'Needs cleaning' },
    { key: 'cleaning', label: 'Cleaning' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'available', label: 'Ready' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Stats — use getAllRooms (housekeeper may not have realtime status permission)
      try {
        const allRoomsData = await roomService.getAllRooms();
        const roomsArray = asArray(allRoomsData, 'rooms');
        setAllRooms(roomsArray);

        const map = {};
        roomsArray.forEach(room => {
          const status = room.status || 'unknown';
          map[status] = (map[status] || 0) + 1;
        });
        setStats({
          dirty: map['dirty'] || 0,
          cleaning: map['cleaning'] || 0,
          ready: map['available'] || 0,
          maintenance: map['maintenance'] || 0,
          occupied: map['occupied'] || 0,
        });
      } catch (statsErr) {
        console.warn('Could not load room stats:', statsErr);
        setStats({
          dirty: 0,
          cleaning: 0,
          ready: 0,
          maintenance: 0,
          occupied: 0,
        });
      }

      try {
        const rooms = await roomService.getCleaningRooms();
        setCleaningRooms(asArray(rooms, 'rooms'));
      } catch (err) {
        console.warn('Could not load cleaning rooms:', err);
        setCleaningRooms([]);
      }
    } catch (err) {
      console.error('Error loading housekeeping data:', err);
      alert('Could not load housekeeping data. Please try again or check the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (room, status) => {
    try {
      const id = room._id || room.roomId || room.id;
      await roomService.updateRoomStatus(id, status);
      alert(`Room ${room.roomNumber || room.number} status updated to "${getStatusLabel(status)}".`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Could not update room status: ' + (err.message || ''));
    }
  };

  const handleStartCleaning = async (room) => {
    await handleUpdateStatus(room, 'cleaning');
  };

  const handleFinishCleaning = async (room) => {
    await handleUpdateStatus(room, 'available');
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
      'available': 'Ready',
      'occupied': 'Occupied',
      'dirty': 'Needs cleaning',
      'cleaning': 'Cleaning',
      'maintenance': 'Maintenance'
    };
    return labels[status] || status;
  };

  const handleSubmitReport = async () => {
    if (!selectedRoom || !reportText.trim()) {
      alert('Please describe the issue.');
      return;
    }
    try {
      await maintenanceService.reportIssue({
        roomId: selectedRoom._id || selectedRoom.roomId || selectedRoom.id,
        description: reportText.trim(),
        priority: 'medium',
      });
      alert('Maintenance report sent. The room has been set to maintenance.');
      setReportText('');
      setShowReportModal(false);
      setSelectedRoom(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Could not send maintenance report.');
    }
  };

  const roomsToShow = activeView === 'cleaning' ? cleaningRooms : allRooms;
  const filteredRoomsToShow = roomsToShow.filter((room) => {
    if (statusFilter === 'all') return true;
    const roomStatus = (room.status || room.roomStatus || '').toString().toLowerCase();
    return roomStatus === statusFilter;
  });

  return (
    <div className={styles.container}>
      <NavBar title="Housekeeping Dashboard" icon={Users} onLogout={onLogout} />

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Room status overview</h2>
        <div className={styles.grid}>
          {[
            { label: 'Needs cleaning', count: stats.dirty, color: '#ef4444' },
            { label: 'Cleaning', count: stats.cleaning, color: '#f97316' },
            { label: 'Ready', count: stats.ready, color: '#22c55e' },
            { label: 'Maintenance', count: stats.maintenance, color: '#eab308' },
            { label: 'Occupied', count: stats.occupied, color: '#3b82f6' },
          ].map((item, i) => (
            <div key={i} className={`${styles.statTile} ${styles.statTileCenter}`}>
              <h3 className={`${styles.statTileLabel} ${styles.statTileLabelPlain}`}>
                {item.label}
              </h3>
              <p
                className={`${styles.statTileValue} ${styles.statTileValuePush}`}
                style={{ color: item.color }}
              >
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className={styles.flexBetween}>
          <h2 className={styles.sectionTitle}>
            {activeView === 'cleaning' ? 'Rooms to clean' : 'All rooms'}
          </h2>
          <div className={styles.toolbarRow}>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${activeView === 'cleaning' ? buttonStyles.primary : ''}`}
              onClick={() => setActiveView('cleaning')}
            >
              To clean ({cleaningRooms.length})
            </button>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${activeView === 'all' ? buttonStyles.primary : ''}`}
              onClick={() => setActiveView('all')}
            >
              All rooms ({allRooms.length})
            </button>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={fetchData}
              title="Refresh data"
            >
              🔄
            </button>
          </div>
        </div>

        <div className={styles.toolbarRowStart}>
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${statusFilter === filter.key ? buttonStyles.primary : ''}`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : roomsToShow.length === 0 ? (
          <p>No rooms to show.</p>
        ) : filteredRoomsToShow.length === 0 ? (
          <p>No rooms match the selected status filter.</p>
        ) : (
          <div className={`${styles.grid} ${styles.gridRooms}`}>
            {filteredRoomsToShow.map((room) => {
              const rawStatus = (room.status || room.roomStatus || '').toString();
              const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
              const statusKey = rawStatus.toLowerCase();
              const roomNumber = room.number || room.roomNumber || room.roomId || room._id;

              return (
                <div key={room._id || room.roomId || room.id} className={styles.dashboardPanel}>
                  <div className={styles.dashboardPanelHeader}>
                    <div>
                      <h3 className={styles.roomCardTitle}>Room {roomNumber}</h3>
                      <p className={styles.panelMuted}>
                        Floor {room.floor || room.floorNumber || '-'}
                      </p>
                    </div>

                    <span
                      className={`
                        ${badgeStyles.badge}
                        ${statusKey === 'dirty' ? badgeStyles.warning : ''}
                        ${statusKey === 'cleaning' ? badgeStyles.occupied : ''}
                        ${statusKey === 'available' ? badgeStyles.success : ''}
                      `}
                    >
                      {status || 'Unknown'}
                    </span>
                  </div>

                  <div className={styles.vStackSm}>
                    {statusKey === 'dirty' && (
                      <button
                        className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                        onClick={() => handleStartCleaning(room)}
                      >
                        <Brush size={16} /> Start cleaning
                      </button>
                    )}

                    {statusKey === 'cleaning' && (
                      <button
                        className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                        onClick={() => handleFinishCleaning(room)}
                      >
                        <CheckCircle size={16} /> Finish cleaning
                      </button>
                    )}

                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => handleOpenStatusModal(room)}
                    >
                      <CheckCircle size={16} /> Update status
                    </button>

                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowReportModal(true);
                      }}
                    >
                      <Wrench size={16} /> Report maintenance
                    </button>

                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <Eye size={16} /> Room details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReportModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Report issue — Room {selectedRoom.roomNumber || selectedRoom.number}</h2>
            <textarea
              className={`${styles.textareaDark} ${styles.mtMd}`}
              placeholder="Describe the problem..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={4}
            />
            <div className={styles.modalFooterBar}>
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowReportModal(false);
                  setReportText('');
                  setSelectedRoom(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleSubmitReport}
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Update status — Room {selectedRoom.roomNumber || selectedRoom.number}</h2>
            <div className={`${styles.modalFormStack} ${styles.mtMd}`}>
              <div>
                <span className={styles.formLabel}>Current status: </span>
                <strong>{getStatusLabel(selectedRoom.status)}</strong>
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="hk-new-status">
                  New status <span className={styles.reqStar}>*</span>
                </label>
                <select
                  id="hk-new-status"
                  className={styles.formInputDark}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="available">Ready</option>
                  <option value="dirty">Needs cleaning</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRoom(null);
                  setNewStatus('');
                }}
              >
                Cancel
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleConfirmStatusUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRoom && !showReportModal && !showStatusModal && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRoom(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Room {selectedRoom.roomNumber || selectedRoom.number}</h2>
            <div className={`${styles.vStackMd} ${styles.mtMd}`}>
              <p>
                <b>Floor:</b> {selectedRoom.floor || selectedRoom.floorNumber || '-'}
              </p>
              <p>
                <b>Room type:</b> {selectedRoom.roomType?.typeName || selectedRoom.type || 'Unknown'}
              </p>
              <p>
                <b>Status:</b>
                <span className={`${badgeStyles.badge} ${styles.badgeSpacer}`}>
                  {getStatusLabel(selectedRoom.status || selectedRoom.roomStatus)}
                </span>
              </p>
              <p>
                <b>Base rate:</b> ₫{Number(selectedRoom.roomType?.basePrice || 0).toLocaleString('en-US')}/night
              </p>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setSelectedRoom(null)}
              >
                Close
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(true);
                }}
              >
                Update status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousekeepingDashboard;

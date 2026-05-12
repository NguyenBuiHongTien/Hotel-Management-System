import React, { useEffect, useState, useCallback } from 'react';
import { Wrench, RefreshCw, Eye } from 'lucide-react';
import NavBar from '../components/NavBar';
import styles from '../styles/Dashboard.module.css';
import badgeStyles from '../styles/Badge.module.css';
import buttonStyles from '../styles/Button.module.css';
import maintenanceService from '../services/maintenanceService';
import { roomService } from '../services/roomService';
import { asArray } from '../utils/apiNormalize';

// Maintenance dashboard loads real data from backend
// Endpoints used:
// GET  /api/maintenance/requests  -> list requests
// PUT  /api/maintenance/:requestId -> update status/assign
// PUT  /api/maintenance/:requestId/complete -> mark completed

const MaintenanceDashboard = ({ onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [maintenanceRooms, setMaintenanceRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await maintenanceService.getRequests();
      setRequests(asArray(data, 'requests'));
    } catch (err) {
      console.error('Failed to load maintenance requests', err);
      alert('Could not load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMaintenanceRooms = useCallback(async () => {
    try {
      const data = await roomService.getMaintenanceRooms();
      setMaintenanceRooms(asArray(data, 'rooms'));
    } catch (err) {
      console.warn('Could not load maintenance rooms:', err);
      setMaintenanceRooms([]);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([loadRequests(), loadMaintenanceRooms()]);
  }, [loadRequests, loadMaintenanceRooms]);

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleAssignToMe = async (requestId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await maintenanceService.updateRequest(requestId, { assignedTo: user._id, status: 'in_progress' });
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Could not assign work');
    }
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm('Mark maintenance complete? The room will be set to "Needs cleaning".')) {
      return;
    }
    try {
      await maintenanceService.completeRequest(requestId);
      alert('Maintenance complete! The room is now marked as needs cleaning.');
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Could not mark complete: ' + (err.message || ''));
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'reported': 'Reported',
      'in_progress': 'In progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    };
    return labels[priority] || priority;
  };

  return (
    <div className={styles.container}>
      <NavBar title="Maintenance" icon={Wrench} onLogout={onLogout} />
      <div className={styles.content}>
        <div className={styles.flexBetween}>
          <h2 className={styles.sectionTitle}>Maintenance requests</h2>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
            onClick={fetchAllData}
            title="Refresh data"
          >
            <RefreshCw size={16} aria-hidden />
            Refresh
          </button>
        </div>

        <div className={`${styles.grid} ${styles.grid3} ${styles.mbLg}`}>
          <div className={styles.statTile}>
            <div className={styles.statTileLabel}>Total requests</div>
            <div className={styles.statTileValue}>{requests.length}</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statTileLabel}>In progress</div>
            <div className={styles.statTileValueAccent}>
              {requests.filter((r) => r.status === 'in_progress').length}
            </div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statTileLabel}>Rooms in maintenance</div>
            <div className={styles.statTileValueGold}>{maintenanceRooms.length}</div>
          </div>
        </div>

        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No maintenance requests.</p>
        ) : (
          <div className={styles.taskListStack}>
            {requests.map(req => (
              <div key={req._id} className={styles.dashboardPanel}>
                <div className={styles.taskCard}>
                  <div className={styles.taskCardMain}>
                    <div className={styles.taskTitleRow}>
                      <h3 className={styles.roomCardTitle}>
                        Room {req.room?.roomNumber || req.room}
                      </h3>
                      <span className={`${badgeStyles.badge} ${
                        req.priority === 'high' ? badgeStyles.danger :
                        req.priority === 'medium' ? badgeStyles.warning : ''
                      }`}>
                        {getPriorityLabel(req.priority)}
                      </span>
                      <span className={`${badgeStyles.badge} ${
                        req.status === 'completed' ? badgeStyles.success :
                        req.status === 'in_progress' ? badgeStyles.info : ''
                      }`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                    <p className={`${styles.panelMuted} ${styles.mbHalf}`}>
                      <strong className={styles.textStrong}>Description:</strong>{' '}
                      {req.issueDescription || req.issue || req.description}
                    </p>
                    {req.reportedBy && (
                      <p className={`${styles.panelMuted} ${styles.mbHalf}`}>
                        Reported by: {req.reportedBy.name || 'N/A'}
                      </p>
                    )}
                    {req.completedAt && (
                      <p className={styles.panelMuted}>
                        Completed: {new Date(req.completedAt).toLocaleString('en-US')}
                      </p>
                    )}
                  </div>
                  <div className={styles.taskCardActions}>
                    {req.status !== 'completed' && req.status !== 'in_progress' && (
                      <button
                        type="button"
                        className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                        onClick={() => handleAssignToMe(req._id)}
                      >
                        Assign to me
                      </button>
                    )}
                    {req.status === 'in_progress' && (
                      <button
                        type="button"
                        className={styles.btnSuccess}
                        onClick={() => handleComplete(req._id)}
                      >
                        Complete
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${buttonStyles.secondary} ${buttonStyles.sm}`}
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowRoomDetail(true);
                      }}
                    >
                      <Eye size={14} aria-hidden />
                      View room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {maintenanceRooms.length > 0 && (
          <div className={styles.mtXl}>
            <h2 className={styles.sectionTitle}>Rooms in maintenance</h2>
            <div className={`${styles.grid} ${styles.gridRooms}`}>
              {maintenanceRooms.map((room) => (
                <div key={room._id} className={`${styles.dashboardPanel} ${styles.panelTight}`}>
                  <div className={styles.flexHeaderRow}>
                    <h3 className={`${styles.roomCardTitle} ${styles.roomCardTitleSm}`}>
                      Room {room.roomNumber}
                    </h3>
                    <span className={`${badgeStyles.badge} ${badgeStyles.warning}`}>Maintenance</span>
                  </div>
                  <p className={styles.panelMuted}>
                    Floor {room.floor || '-'} | {room.roomType?.typeName || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRoomDetail && selectedRequest && (
          <div className={styles.modalOverlay} onClick={() => setShowRoomDetail(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalFormTitle}>Room {selectedRequest.room?.roomNumber || selectedRequest.room}</h2>
              <div className={styles.modalFormStack}>
                <p><b>Status:</b>
                  <span className={`${badgeStyles.badge} ${badgeStyles.warning} ${styles.badgeSpacer}`}>
                    Maintenance
                  </span>
                </p>
                <p><b>Request:</b> {selectedRequest.issueDescription || 'N/A'}</p>
                <p><b>Priority:</b> {getPriorityLabel(selectedRequest.priority)}</p>
                <p><b>Request status:</b> {getStatusLabel(selectedRequest.status)}</p>
                {selectedRequest.reportedBy && (
                  <p><b>Reported by:</b> {selectedRequest.reportedBy.name || 'N/A'}</p>
                )}
                {selectedRequest.completedAt && (
                  <p><b>Completed:</b> {new Date(selectedRequest.completedAt).toLocaleString('en-US')}</p>
                )}
              </div>
              <div className={styles.modalFooterBar}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowRoomDetail(false);
                    setSelectedRequest(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;

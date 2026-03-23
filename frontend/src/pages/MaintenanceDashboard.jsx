import React, { useEffect, useState } from 'react';
import { Wrench, RefreshCw, Eye } from 'lucide-react';
import NavBar from '../components/NavBar';
import styles from '../styles/Dashboard.module.css';
import badgeStyles from '../styles/Badge.module.css';
import buttonStyles from '../styles/Button.module.css';
import { apiCall } from '../config/api';
import maintenanceService from '../services/maintenanceService';
import { roomService } from '../services/roomService';

// Maintenance dashboard now loads real data from backend
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

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await maintenanceService.getRequests();
      setRequests(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Failed to load maintenance requests', err);
      alert('Không thể tải yêu cầu bảo trì.');
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceRooms = async () => {
    try {
      const data = await roomService.getMaintenanceRooms();
      setMaintenanceRooms(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.warn('Could not load maintenance rooms:', err);
      setMaintenanceRooms([]);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([loadRequests(), loadMaintenanceRooms()]);
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh mỗi 30 giây để đồng bộ trạng thái
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAssignToMe = async (requestId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await maintenanceService.updateRequest(requestId, { assignedTo: user._id, status: 'in_progress' });
      await fetchAllData(); // Refresh cả requests và rooms
    } catch (err) {
      console.error(err);
      alert('Không thể gán công việc');
    }
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm('Xác nhận hoàn thành bảo trì? Phòng sẽ tự động chuyển sang trạng thái "Cần dọn".')) {
      return;
    }
    try {
      await maintenanceService.completeRequest(requestId);
      alert('Đã hoàn thành bảo trì! Phòng đã chuyển sang trạng thái "Cần dọn".');
      await fetchAllData(); // Refresh cả requests và rooms để đồng bộ
    } catch (err) {
      console.error(err);
      alert('Không thể đánh dấu hoàn thành: ' + (err.message || ''));
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'reported': 'Đã báo cáo',
      'in_progress': 'Đang xử lý',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'low': 'Thấp',
      'medium': 'Trung bình',
      'high': 'Cao'
    };
    return labels[priority] || priority;
  };

  return (
    <div className={styles.container}>
      <NavBar title="Bảo trì" icon={Wrench} onLogout={onLogout} />
      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>Yêu cầu bảo trì</h2>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
            onClick={fetchAllData}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} style={{ marginRight: '0.25rem' }} />
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className={`${styles.grid} ${styles.grid3}`} style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng yêu cầu</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{requests.length}</div>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Đang xử lý</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316' }}>
              {requests.filter(r => r.status === 'in_progress').length}
            </div>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Phòng đang bảo trì</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>{maintenanceRooms.length}</div>
          </div>
        </div>

        {/* Maintenance Requests */}
        {loading ? (
          <p>Đang tải yêu cầu...</p>
        ) : requests.length === 0 ? (
          <p>Không có yêu cầu bảo trì.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {requests.map(req => (
              <div key={req._id} style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
                        Phòng {req.room?.roomNumber || req.room}
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
                    <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                      <strong>Mô tả:</strong> {req.issueDescription || req.issue || req.description}
                    </p>
                    {req.reportedBy && (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        Báo cáo bởi: {req.reportedBy.name || 'N/A'}
                      </p>
                    )}
                    {req.completedAt && (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                        Hoàn thành: {new Date(req.completedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    {req.status !== 'completed' && req.status !== 'in_progress' && (
                      <button 
                        className={`${buttonStyles.primary} ${buttonStyles.sm}`} 
                        onClick={() => handleAssignToMe(req._id)}
                      >
                        Gán cho tôi
                      </button>
                    )}
                    {req.status === 'in_progress' && (
                      <button 
                        className={`${buttonStyles.primary} ${buttonStyles.sm}`} 
                        style={{ background: '#16a34a' }} 
                        onClick={() => handleComplete(req._id)}
                      >
                        Hoàn thành
                      </button>
                    )}
                    <button
                      className={`${buttonStyles.secondary} ${buttonStyles.sm}`}
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowRoomDetail(true);
                      }}
                    >
                      <Eye size={14} style={{ marginRight: '0.25rem' }} />
                      Xem phòng
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Maintenance Rooms List */}
        {maintenanceRooms.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>Phòng đang bảo trì</h2>
            <div className={`${styles.grid} ${styles.gridRooms}`}>
              {maintenanceRooms.map(room => (
                <div key={room._id} style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Phòng {room.roomNumber}</h3>
                    <span className={`${badgeStyles.badge} ${badgeStyles.warning}`}>
                      Bảo trì
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Tầng {room.floor || '-'} | {room.roomType?.typeName || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Detail Modal */}
        {showRoomDetail && selectedRequest && (
          <div className={styles.modalOverlay} onClick={() => setShowRoomDetail(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>Chi tiết phòng {selectedRequest.room?.roomNumber || selectedRequest.room}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <p><b>Trạng thái:</b> 
                  <span className={`${badgeStyles.badge} ${badgeStyles.warning}`} style={{ marginLeft: '0.5rem' }}>
                    Bảo trì
                  </span>
                </p>
                <p><b>Yêu cầu bảo trì:</b> {selectedRequest.issueDescription || 'N/A'}</p>
                <p><b>Mức độ ưu tiên:</b> {getPriorityLabel(selectedRequest.priority)}</p>
                <p><b>Trạng thái yêu cầu:</b> {getStatusLabel(selectedRequest.status)}</p>
                {selectedRequest.reportedBy && (
                  <p><b>Báo cáo bởi:</b> {selectedRequest.reportedBy.name || 'N/A'}</p>
                )}
                {selectedRequest.completedAt && (
                  <p><b>Hoàn thành:</b> {new Date(selectedRequest.completedAt).toLocaleString('vi-VN')}</p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowRoomDetail(false);
                    setSelectedRequest(null);
                  }}
                >
                  Đóng
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
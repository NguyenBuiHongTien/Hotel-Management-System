// src/pages/HousekeepingDashboard.jsx

import React, { useEffect, useState } from 'react';
import { Users, Wrench, Eye, Brush, CheckCircle } from 'lucide-react';
import NavBar from '../components/NavBar';
import styles from '../styles/Dashboard.module.css';
import badgeStyles from '../styles/Badge.module.css';
import buttonStyles from '../styles/Button.module.css';
import { apiCall } from '../config/api';
import { roomService } from '../services/roomService';
import maintenanceService from '../services/maintenanceService';

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
  const [activeView, setActiveView] = useState('cleaning'); // 'cleaning' or 'all'

  // Load stats + danh sách phòng
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Stats tổng quan - Sử dụng getAllRooms thay vì getRealtimeRoomStatus (housekeeper không có quyền)
      try {
        const allRoomsData = await roomService.getAllRooms();
        const roomsArray = Array.isArray(allRoomsData) ? allRoomsData : (allRoomsData.data || []);
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

      // 2. Danh sách phòng cần dọn
      try {
        const rooms = await roomService.getCleaningRooms();
        setCleaningRooms(Array.isArray(rooms) ? rooms : (rooms.data || []));
      } catch (err) {
        console.warn('Could not load cleaning rooms:', err);
        setCleaningRooms([]);
      }
    } catch (err) {
      console.error('Error loading housekeeping data:', err);
      alert('Không tải được dữ liệu dọn phòng. Vui lòng thử lại hoặc kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh mỗi 30 giây để đồng bộ trạng thái
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cập nhật trạng thái phòng
  const handleUpdateStatus = async (room, status) => {
    try {
      const id = room._id || room.roomId || room.id;
      await roomService.updateRoomStatus(id, status);
      alert(`Đã cập nhật trạng thái phòng ${room.roomNumber || room.number} thành "${getStatusLabel(status)}".`);
      // Refresh data để đồng bộ
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật trạng thái phòng: ' + (err.message || ''));
    }
  };

  // Bắt đầu dọn phòng
  const handleStartCleaning = async (room) => {
    await handleUpdateStatus(room, 'cleaning');
  };

  // Hoàn tất dọn phòng
  const handleFinishCleaning = async (room) => {
    await handleUpdateStatus(room, 'available');
  };

  // Mở modal cập nhật trạng thái
  const handleOpenStatusModal = (room) => {
    setSelectedRoom(room);
    setNewStatus(room.status || '');
    setShowStatusModal(true);
  };

  // Xác nhận cập nhật trạng thái
  const handleConfirmStatusUpdate = async () => {
    if (!selectedRoom || !newStatus) return;
    await handleUpdateStatus(selectedRoom, newStatus);
    setShowStatusModal(false);
    setSelectedRoom(null);
    setNewStatus('');
  };

  // Helper function để lấy label trạng thái
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

  // Gửi báo cáo bảo trì
  const handleSubmitReport = async () => {
    if (!selectedRoom || !reportText.trim()) {
      alert('Vui lòng nhập mô tả sự cố.');
      return;
    }
    try {
      await maintenanceService.reportIssue({
        roomId: selectedRoom._id || selectedRoom.roomId || selectedRoom.id,
        description: reportText.trim(),
        priority: 'medium',
      });
      alert('Đã gửi báo cáo bảo trì. Phòng sẽ tự động chuyển sang trạng thái "Bảo trì".');
      setReportText('');
      setShowReportModal(false);
      setSelectedRoom(null);
      // Refresh để cập nhật trạng thái phòng
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Không thể gửi báo cáo bảo trì.');
    }
  };

  const roomsToShow = activeView === 'cleaning' ? cleaningRooms : allRooms;

  return (
    <div className={styles.container}>
      <NavBar title="Housekeeping Dashboard" icon={Users} onLogout={onLogout} />

      <div className={styles.content}>
        {/* --------------------------------------------------- */}
        {/* 1. ROOM STATUS SUMMARY */}
        {/* --------------------------------------------------- */}
        <h2 className={styles.sectionTitle}>Tổng quan trạng thái phòng</h2>
        <div className={styles.grid}>
          {[
            { label: 'Cần dọn', count: stats.dirty, color: '#ef4444' },
            { label: 'Đang dọn', count: stats.cleaning, color: '#f97316' },
            { label: 'Sẵn sàng', count: stats.ready, color: '#22c55e' },
            { label: 'Đang bảo trì', count: stats.maintenance, color: '#eab308' },
            { label: 'Đang có khách', count: stats.occupied, color: '#3b82f6' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ fontSize: '1rem', color: '#374151' }}>{item.label}</h3>
              <p
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.count}
              </p>
            </div>
          ))}
        </div>

        {/* --------------------------------------------------- */}
        {/* 2. ROOM MANAGEMENT */}
        {/* --------------------------------------------------- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>
            {activeView === 'cleaning' ? 'Danh sách phòng cần dọn' : 'Tất cả phòng'}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${activeView === 'cleaning' ? buttonStyles.primary : ''}`}
              onClick={() => setActiveView('cleaning')}
            >
              Phòng cần dọn ({cleaningRooms.length})
            </button>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${activeView === 'all' ? buttonStyles.primary : ''}`}
              onClick={() => setActiveView('all')}
            >
              Tất cả phòng ({allRooms.length})
            </button>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={fetchData}
              title="Làm mới dữ liệu"
            >
              🔄
            </button>
          </div>
        </div>

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (activeView === 'cleaning' ? cleaningRooms : allRooms).length === 0 ? (
          <p>Hiện không có phòng nào.</p>
        ) : (
          <div className={`${styles.grid} ${styles.gridRooms}`}>
            {roomsToShow.map((room) => {
              const rawStatus = (room.status || room.roomStatus || '').toString();
              const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
              const statusKey = rawStatus.toLowerCase();
              const roomNumber = room.number || room.roomNumber || room.roomId || room._id;

              return (
                <div
                  key={room._id || room.roomId || room.id}
                  style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '1.5rem',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                        Phòng {roomNumber}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Tầng {room.floor || room.floorNumber || '-'}
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

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {statusKey === 'dirty' && (
                      <button
                        className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                        onClick={() => handleStartCleaning(room)}
                      >
                        <Brush size={16} /> Bắt đầu dọn phòng
                      </button>
                    )}

                    {statusKey === 'cleaning' && (
                      <button
                        className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                        onClick={() => handleFinishCleaning(room)}
                      >
                        <CheckCircle size={16} /> Hoàn tất dọn phòng
                      </button>
                    )}

                    {/* Nút cập nhật trạng thái cho tất cả phòng */}
                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => handleOpenStatusModal(room)}
                    >
                      <CheckCircle size={16} /> Cập nhật trạng thái
                    </button>

                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowReportModal(true);
                      }}
                    >
                      <Wrench size={16} /> Báo lỗi bảo trì
                    </button>

                    <button
                      className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <Eye size={16} /> Xem chi tiết phòng
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --------------------------------------------------- */}
      {/* 3. REPORT MAINTENANCE MODAL */}
      {/* --------------------------------------------------- */}
      {showReportModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Báo cáo sự cố – Phòng {selectedRoom.roomNumber || selectedRoom.number}</h2>
            <textarea
              placeholder="Mô tả vấn đề..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                marginTop: '10px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowReportModal(false);
                  setReportText('');
                  setSelectedRoom(null);
                }}
              >
                Hủy
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleSubmitReport}
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* 4. STATUS UPDATE MODAL */}
      {/* --------------------------------------------------- */}
      {showStatusModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Cập nhật trạng thái - Phòng {selectedRoom.roomNumber || selectedRoom.number}</h2>
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
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRoom(null);
                  setNewStatus('');
                }}
              >
                Hủy
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleConfirmStatusUpdate}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* 5. ROOM DETAIL MODAL */}
      {/* --------------------------------------------------- */}
      {selectedRoom && !showReportModal && !showStatusModal && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRoom(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Chi tiết phòng {selectedRoom.roomNumber || selectedRoom.number}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <p>
                <b>Tầng:</b> {selectedRoom.floor || selectedRoom.floorNumber || '-'}
              </p>
              <p>
                <b>Loại phòng:</b> {selectedRoom.roomType?.typeName || selectedRoom.type || 'Không rõ'}
              </p>
              <p>
                <b>Trạng thái:</b> 
                <span className={`${badgeStyles.badge}`} style={{ marginLeft: '0.5rem' }}>
                  {getStatusLabel(selectedRoom.status || selectedRoom.roomStatus)}
                </span>
              </p>
              <p>
                <b>Giá cơ bản:</b> ₫{Number(selectedRoom.roomType?.basePrice || 0).toLocaleString()}/đêm
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setSelectedRoom(null)}
              >
                Đóng
              </button>
              <button
                className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowStatusModal(true);
                }}
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousekeepingDashboard;

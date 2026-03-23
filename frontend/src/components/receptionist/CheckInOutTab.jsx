import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Calendar, RefreshCw, Eye } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useBookings } from '../../hooks/useBookings';
import styles from '../../styles/Dashboard.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import tableStyles from '../../styles/Table.module.css';

const CheckInOutTab = () => {
  const { bookings, refetch } = useBookings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState('checkin'); // 'checkin' or 'checkout'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'upcoming'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Auto-refresh mỗi 30 giây để đồng bộ
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Filter bookings for check-in (confirmed status)
  const getCheckInBookings = () => {
    let filtered = bookings.filter(booking => booking.status === 'confirmed');
    
    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(booking => {
        const checkInDate = new Date(booking.checkInDate).toISOString().split('T')[0];
        return checkInDate === today;
      });
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(booking => {
        const checkInDate = new Date(booking.checkInDate).toISOString().split('T')[0];
        return checkInDate >= today;
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.guest?.fullName || '').toLowerCase().includes(term) ||
        (booking.room?.roomNumber || '').toLowerCase().includes(term) ||
        (booking.guest?.phoneNumber || '').includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
  };

  // Filter bookings for check-out (checked_in status)
  const getCheckOutBookings = () => {
    let filtered = bookings.filter(booking => booking.status === 'checked_in');
    
    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(booking => {
        const checkOutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
        return checkOutDate === today;
      });
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(booking => {
        const checkOutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
        return checkOutDate >= today;
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.guest?.fullName || '').toLowerCase().includes(term) ||
        (booking.room?.roomNumber || '').toLowerCase().includes(term) ||
        (booking.guest?.phoneNumber || '').includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(a.checkOutDate) - new Date(b.checkOutDate));
  };

  const checkInsAvailable = getCheckInBookings();
  const checkOutsAvailable = getCheckOutBookings();

  const handleCheckIn = async (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    const confirmMsg = `Xác nhận check-in cho:\n- Khách: ${booking.guest?.fullName || 'N/A'}\n- Phòng: ${booking.room?.roomNumber || 'N/A'}\n- Ngày: ${new Date(booking.checkInDate).toLocaleDateString('vi-VN')}`;
    
    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      try {
        await bookingService.checkIn(bookingId);
        alert('Check-in thành công! Phòng đã chuyển sang trạng thái "Đang có khách".');
        await refetch();
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể check-in'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCheckOut = async (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    const confirmMsg = `Xác nhận check-out cho:\n- Khách: ${booking.guest?.fullName || 'N/A'}\n- Phòng: ${booking.room?.roomNumber || 'N/A'}\n- Ngày: ${new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}\n\nPhòng sẽ chuyển sang trạng thái "Cần dọn" và hóa đơn sẽ được tạo tự động.`;
    
    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      try {
        const result = await bookingService.checkOut(bookingId);
        alert(`Check-out thành công!\nHóa đơn đã được tạo.\nTổng tiền: ₫${Number(result.invoice?.totalAmount || booking.totalPrice || 0).toLocaleString()}`);
        await refetch();
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể check-out'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Check-in & Check-out</h2>
        <button
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
          onClick={refetch}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={16} style={{ marginRight: '0.25rem' }} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md} ${activeView === 'checkin' ? buttonStyles.primary : ''}`}
          onClick={() => setActiveView('checkin')}
        >
          <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
          Check-in ({checkInsAvailable.length})
        </button>
        <button
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md} ${activeView === 'checkout' ? buttonStyles.primary : ''}`}
          onClick={() => setActiveView('checkout')}
        >
          <XCircle size={18} style={{ marginRight: '0.5rem' }} />
          Check-out ({checkOutsAvailable.length})
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, số phòng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">Tất cả ngày</option>
            <option value="today">Hôm nay</option>
            <option value="upcoming">Sắp tới</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid2}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Có thể check-in</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{checkInsAvailable.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Có thể check-out</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{checkOutsAvailable.length}</div>
        </div>
      </div>

      {/* Check-in Section */}
      {activeView === 'checkin' && (
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <CheckCircle className="text-green-600" size={24} style={{ marginRight: '0.5rem' }} /> 
            Danh sách check-in ({checkInsAvailable.length})
          </h3>
          {checkInsAvailable.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              Không có đặt phòng nào cần check-in
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Khách hàng</th>
                    <th className={tableStyles.th}>SĐT</th>
                    <th className={tableStyles.th}>Phòng</th>
                    <th className={tableStyles.th}>Check-in</th>
                    <th className={tableStyles.th}>Check-out</th>
                    <th className={tableStyles.th}>Số khách</th>
                    <th className={tableStyles.th}>Tổng tiền</th>
                    <th className={tableStyles.th}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {checkInsAvailable.map(booking => (
                    <tr key={booking._id}>
                      <td className={tableStyles.td}>{booking.guest?.fullName || 'N/A'}</td>
                      <td className={tableStyles.td}>{booking.guest?.phoneNumber || '—'}</td>
                      <td className={tableStyles.td}>
                        <strong>Phòng {booking.room?.roomNumber || 'N/A'}</strong>
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={tableStyles.td}>{booking.numberOfGuests || 1}</td>
                      <td className={tableStyles.td}>
                        ₫{Number(booking.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className={tableStyles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                            onClick={() => handleCheckIn(booking._id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                            Check-in
                          </button>
                          <button
                            className={tableStyles.actionBtn}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Check-out Section */}
      {activeView === 'checkout' && (
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <XCircle className="text-red-600" size={24} style={{ marginRight: '0.5rem' }} /> 
            Danh sách check-out ({checkOutsAvailable.length})
          </h3>
          {checkOutsAvailable.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              Không có đặt phòng nào cần check-out
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Khách hàng</th>
                    <th className={tableStyles.th}>SĐT</th>
                    <th className={tableStyles.th}>Phòng</th>
                    <th className={tableStyles.th}>Check-in</th>
                    <th className={tableStyles.th}>Check-out</th>
                    <th className={tableStyles.th}>Số khách</th>
                    <th className={tableStyles.th}>Tổng tiền</th>
                    <th className={tableStyles.th}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {checkOutsAvailable.map(booking => (
                    <tr key={booking._id}>
                      <td className={tableStyles.td}>{booking.guest?.fullName || 'N/A'}</td>
                      <td className={tableStyles.td}>{booking.guest?.phoneNumber || '—'}</td>
                      <td className={tableStyles.td}>
                        <strong>Phòng {booking.room?.roomNumber || 'N/A'}</strong>
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={tableStyles.td}>{booking.numberOfGuests || 1}</td>
                      <td className={tableStyles.td}>
                        ₫{Number(booking.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className={tableStyles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                            style={{ background: '#dc2626' }}
                            onClick={() => handleCheckOut(booking._id)}
                            disabled={isProcessing}
                          >
                            <XCircle size={14} style={{ marginRight: '0.25rem' }} />
                            Check-out
                          </button>
                          <button
                            className={tableStyles.actionBtn}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Chi tiết đặt phòng</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>Khách hàng:</strong> {selectedBooking.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Số điện thoại:</strong> {selectedBooking.guest?.phoneNumber || '—'}
              </div>
              <div>
                <strong>Email:</strong> {selectedBooking.guest?.email || '—'}
              </div>
              <div>
                <strong>Phòng:</strong> {selectedBooking.room?.roomNumber || 'N/A'} 
                {selectedBooking.room?.roomType && ` (${selectedBooking.room.roomType.typeName})`}
              </div>
              <div>
                <strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toLocaleDateString('vi-VN')}
              </div>
              <div>
                <strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toLocaleDateString('vi-VN')}
              </div>
              <div>
                <strong>Số khách:</strong> {selectedBooking.numberOfGuests || 1}
              </div>
              <div>
                <strong>Tổng tiền:</strong> ₫{Number(selectedBooking.totalPrice || 0).toLocaleString()}
              </div>
              <div>
                <strong>Trạng thái:</strong>
                <span className={`${badgeStyles.badge} ${
                  selectedBooking.status === 'confirmed' ? badgeStyles.info :
                  selectedBooking.status === 'checked_in' ? badgeStyles.success :
                  selectedBooking.status === 'checked_out' ? badgeStyles.secondary : ''
                }`} style={{ marginLeft: '0.5rem' }}>
                  {selectedBooking.status === 'confirmed' ? 'Đã xác nhận' :
                   selectedBooking.status === 'checked_in' ? 'Đã check-in' :
                   selectedBooking.status === 'checked_out' ? 'Đã check-out' :
                   selectedBooking.status === 'cancelled' ? 'Đã hủy' : selectedBooking.status}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              {selectedBooking.status === 'confirmed' && (
                <button
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCheckIn(selectedBooking._id);
                  }}
                  disabled={isProcessing}
                >
                  Check-in
                </button>
              )}
              {selectedBooking.status === 'checked_in' && (
                <button
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                  style={{ background: '#dc2626' }}
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCheckOut(selectedBooking._id);
                  }}
                  disabled={isProcessing}
                >
                  Check-out
                </button>
              )}
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBooking(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOutTab;

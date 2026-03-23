import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Calendar, User, Bed, DollarSign, Filter, X } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { bookingService } from '../../services/bookingService';
import { guestService } from '../../services/guestService';
import { roomService } from '../../services/roomService';
import styles from '../../styles/Table.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import dashboardStyles from '../../styles/Dashboard.module.css';

const BookingsTab = () => {
  const { bookings, isLoading, error, createBooking, updateBooking, cancelBooking, refetch } = useBookings();
  const [showModal, setShowModal] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [guests, setGuests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  const [newBooking, setNewBooking] = useState({
    customerId: '',
    guestInfo: { fullName: '', phoneNumber: '', email: '' },
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1
  });
  const [useExistingGuest, setUseExistingGuest] = useState(true);

  // Filter bookings based on status
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') {
      return bookings;
    }
    return bookings.filter(booking => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  // Count bookings by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0
    };
    bookings.forEach(booking => {
      if (booking.status && counts.hasOwnProperty(booking.status)) {
        counts[booking.status]++;
      }
    });
    return counts;
  }, [bookings]);

  useEffect(() => {
    // Load guests and rooms when modal opens
    if (showModal) {
      loadGuests();
      if (newBooking.checkInDate && newBooking.checkOutDate) {
        loadAvailableRooms();
      }
    }
  }, [showModal, newBooking.checkInDate, newBooking.checkOutDate]);

  const loadGuests = async () => {
    try {
      const data = await guestService.getAllGuests();
      setGuests(data);
    } catch (err) {
      console.error('Error loading guests:', err);
    }
  };

  const loadAvailableRooms = async () => {
    if (!newBooking.checkInDate || !newBooking.checkOutDate) return;
    try {
      const data = await roomService.getAvailableRooms(
        newBooking.checkInDate,
        newBooking.checkOutDate
      );
      setAvailableRooms(data);
    } catch (err) {
      console.error('Error loading available rooms:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('guestInfo.')) {
      const field = name.split('.')[1];
      setNewBooking(prev => ({
        ...prev,
        guestInfo: { ...prev.guestInfo, [field]: value }
      }));
    } else {
      setNewBooking(prev => ({ ...prev, [name]: value }));
      if (name === 'checkInDate' || name === 'checkOutDate') {
        // Reload available rooms when dates change
        setTimeout(loadAvailableRooms, 100);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...(useExistingGuest && newBooking.customerId ? { customerId: newBooking.customerId } : {}),
        ...(!useExistingGuest ? { guestInfo: newBooking.guestInfo } : {}),
        roomId: newBooking.roomId,
        checkInDate: newBooking.checkInDate,
        checkOutDate: newBooking.checkOutDate,
        numberOfGuests: parseInt(newBooking.numberOfGuests) || 1
      };

      if (editingBookingId) {
        await updateBooking(editingBookingId, bookingData);
        alert('Cập nhật đặt phòng thành công!');
      } else {
        await createBooking(bookingData);
        alert('Đặt phòng thành công!');
      }
      setShowModal(false);
      setNewBooking({
        customerId: '',
        guestInfo: { fullName: '', phoneNumber: '', email: '' },
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1
      });
      setEditingBookingId(null);
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể tạo đặt phòng'));
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đặt phòng này?')) {
      try {
        await cancelBooking(bookingId);
        alert('Đã hủy đặt phòng');
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể hủy đặt phòng'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return badgeStyles.info;
      case 'checked_in':
        return badgeStyles.success;
      case 'checked_out':
        return badgeStyles.warning;
      case 'cancelled':
        return badgeStyles.danger || badgeStyles.warning;
      default:
        return badgeStyles.warning;
    }
  };

  if (isLoading && bookings.length === 0) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      {/* Header + Add Button */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Calendar size={24} />
          Quản lý đặt phòng
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className={buttonStyles.primary}
        >
          <Plus size={24} />
          Đặt phòng mới
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Filter Bar */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#374151' }}>
          <Filter size={18} />
          <span>Lọc theo trạng thái:</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          {[
            { value: 'all', label: 'Tất cả', count: statusCounts.all },
            { value: 'pending', label: 'Chờ xác nhận', count: statusCounts.pending },
            { value: 'confirmed', label: 'Đã xác nhận', count: statusCounts.confirmed },
            { value: 'checked_in', label: 'Đã check-in', count: statusCounts.checked_in },
            { value: 'checked_out', label: 'Đã check-out', count: statusCounts.checked_out },
            { value: 'cancelled', label: 'Đã hủy', count: statusCounts.cancelled }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`${buttonStyles.base} ${buttonStyles.sm} ${
                statusFilter === option.value ? buttonStyles.primary : buttonStyles.secondary
              }`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'relative'
              }}
            >
              <span>{option.label}</span>
              {option.count > 0 && (
                <span style={{
                  background: statusFilter === option.value ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className={`${buttonStyles.base} ${buttonStyles.sm} ${buttonStyles.secondary}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Xóa bộ lọc"
          >
            <X size={14} />
            Xóa lọc
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className={dashboardStyles.grid} style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng đặt phòng</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{statusCounts.all}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Đã xác nhận</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{statusCounts.confirmed}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Đang ở</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{statusCounts.checked_in}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Đã hủy</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{statusCounts.cancelled}</div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th><Calendar size={16} /> Mã</th>
              <th><User size={16} /> Khách</th>
              <th><Bed size={16} /> Phòng</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Trạng thái</th>
              <th><DollarSign size={16} /> Tổng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  {statusFilter === 'all' 
                    ? 'Không có đặt phòng nào'
                    : `Không có đặt phòng nào với trạng thái "${[
                        { value: 'pending', label: 'Chờ xác nhận' },
                        { value: 'confirmed', label: 'Đã xác nhận' },
                        { value: 'checked_in', label: 'Đã check-in' },
                        { value: 'checked_out', label: 'Đã check-out' },
                        { value: 'cancelled', label: 'Đã hủy' }
                      ].find(s => s.value === statusFilter)?.label || statusFilter}"`
                  }
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking._id} className={styles.row}>
                  <td className={styles.id}>#{booking._id.slice(-6)}</td>
                  <td className={styles.customer}>
                    {booking.guest?.fullName || 'N/A'}
                  </td>
                  <td className={styles.room}>
                    {booking.room?.roomNumber || 'N/A'}
                  </td>
                  <td className={styles.date}>
                    {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className={styles.date}>
                    {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span className={`${badgeStyles.badge} ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status === 'confirmed' ? 'Đã xác nhận' :
                       booking.status === 'checked_in' ? 'Đã check-in' :
                       booking.status === 'checked_out' ? 'Đã check-out' :
                       booking.status === 'cancelled' ? 'Đã hủy' : booking.status}
                    </span>
                  </td>
                  <td className={styles.price}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice || 0)}
                  </td>
                  <td className={styles.actions}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        title="Chỉnh sửa"
                        className={buttonStyles.secondary}
                        onClick={() => {
                          // populate modal with booking data for edit
                          setEditingBookingId(booking._id);
                          setShowModal(true);
                          setUseExistingGuest(!!booking.customer);
                          setNewBooking({
                            customerId: booking.customer?._id || booking.customer || '',
                            guestInfo: {
                              fullName: booking.guest?.fullName || '',
                              phoneNumber: booking.guest?.phoneNumber || '',
                              email: booking.guest?.email || ''
                            },
                            roomId: booking.room?._id || booking.room,
                            checkInDate: booking.checkInDate ? booking.checkInDate.split('T')[0] : '',
                            checkOutDate: booking.checkOutDate ? booking.checkOutDate.split('T')[0] : '',
                            numberOfGuests: booking.numberOfGuests || 1
                          });
                        }}
                      >
                        <Edit size={14} />
                      </button>

                      <button 
                        className={styles.deleteBtn} 
                        title="Hủy"
                        onClick={() => handleCancel(booking._id)}
                        disabled={booking.status === 'checked_in' || booking.status === 'checked_out'}
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

      {/* Booking Form Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowModal(false); setEditingBookingId(null); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{editingBookingId ? 'Chỉnh sửa đặt phòng' : 'Đặt phòng mới'}</h3>

            <form onSubmit={handleSubmit} className={styles.formContainer}>
              <div className={styles.formGrid}>
                <div>
                  <label>
                    <input
                      type="radio"
                      checked={useExistingGuest}
                      onChange={() => setUseExistingGuest(true)}
                    />
                    Khách hàng có sẵn
                  </label>
                  {useExistingGuest && (
                    <select
                      name="customerId"
                      value={newBooking.customerId}
                      onChange={handleChange}
                      required={useExistingGuest}
                    >
                      <option value="">Chọn khách hàng</option>
                      {guests.map(guest => (
                        <option key={guest._id} value={guest._id}>
                          {guest.fullName} - {guest.phoneNumber}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label>
                    <input
                      type="radio"
                      checked={!useExistingGuest}
                      onChange={() => setUseExistingGuest(false)}
                    />
                    Khách hàng mới
                  </label>
                  {!useExistingGuest && (
                    <>
                      <input
                        type="text"
                        name="guestInfo.fullName"
                        value={newBooking.guestInfo.fullName}
                        onChange={handleChange}
                        placeholder="Họ tên"
                        required={!useExistingGuest}
                      />
                      <input
                        type="text"
                        name="guestInfo.phoneNumber"
                        value={newBooking.guestInfo.phoneNumber}
                        onChange={handleChange}
                        placeholder="Số điện thoại"
                        required={!useExistingGuest}
                        style={{ marginTop: '0.5rem' }}
                      />
                      <input
                        type="email"
                        name="guestInfo.email"
                        value={newBooking.guestInfo.email}
                        onChange={handleChange}
                        placeholder="Email (tùy chọn)"
                        style={{ marginTop: '0.5rem' }}
                      />
                    </>
                  )}
                </div>

                <div>
                  <label>Ngày check-in</label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={newBooking.checkInDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label>Ngày check-out</label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={newBooking.checkOutDate}
                    onChange={handleChange}
                    required
                    min={newBooking.checkInDate}
                  />
                </div>
                <div>
                  <label>Phòng</label>
                  <select
                    name="roomId"
                    value={newBooking.roomId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn phòng</option>
                    {availableRooms.map(room => (
                      <option key={room._id} value={room._id}>
                        {room.roomNumber} - {room.roomType?.typeName || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Số khách</label>
                  <input
                    type="number"
                    name="numberOfGuests"
                    value={newBooking.numberOfGuests}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={buttonStyles.primary}>Lưu</button>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={() => { setShowModal(false); setEditingBookingId(null); }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTab;

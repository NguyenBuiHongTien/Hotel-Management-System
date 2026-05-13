import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Calendar, User, Bed, DollarSign, Filter, X } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { guestService } from '../../services/guestService';
import { asArray } from '../../utils/apiNormalize';
import { roomService } from '../../services/roomService';
import { roomTypeService } from '../../services/roomTypeService';
import { addDaysToDateInputValue, formatViDate, toDateInputValue } from '../../utils/dateDisplay';
import styles from '../../styles/Table.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import dashboardStyles from '../../styles/Dashboard.module.css';

const emptyBookingForm = () => ({
  customerId: '',
  guestInfo: { fullName: '', phoneNumber: '', email: '' },
  roomId: '',
  checkInDate: '',
  checkOutDate: '',
  numberOfGuests: 1
});

const BookingsTab = () => {
  const { bookings, isLoading, error, createBooking, updateBooking, cancelBooking } = useBookings();
  const [showModal, setShowModal] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [guests, setGuests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  const [newBooking, setNewBooking] = useState(emptyBookingForm);
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
      if (booking.status && Object.hasOwn(counts, booking.status)) {
        counts[booking.status]++;
      }
    });
    return counts;
  }, [bookings]);

  const loadGuests = useCallback(async () => {
    try {
      const data = await guestService.getAllGuests();
      setGuests(asArray(data, 'guests'));
    } catch (err) {
      console.error('Error loading guests:', err);
      setGuests([]);
    }
  }, []);

  const loadRoomTypes = useCallback(async () => {
    try {
      const data = await roomTypeService.getAllRoomTypes();
      setRoomTypes(asArray(data, 'roomTypes'));
    } catch (err) {
      console.error('Error loading room types:', err);
      setRoomTypes([]);
    }
  }, []);

  const minCheckoutDate = useMemo(
    () => addDaysToDateInputValue(newBooking.checkInDate, 1),
    [newBooking.checkInDate]
  );

  useEffect(() => {
    if (!showModal) return;
    loadGuests();
    loadRoomTypes();
  }, [showModal, loadGuests, loadRoomTypes]);

  useEffect(() => {
    if (!showModal) return;
    if (!newBooking.checkInDate || !newBooking.checkOutDate) {
      setAvailableRooms([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const filters = {
          ...(editingBookingId ? { excludeBookingId: editingBookingId } : {}),
          ...(roomTypeFilter ? { roomTypeId: roomTypeFilter } : {}),
        };
        const data = await roomService.getAvailableRooms(
          newBooking.checkInDate,
          newBooking.checkOutDate,
          filters
        );
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setAvailableRooms(list);
        setNewBooking(prev => {
          if (!prev.roomId) return prev;
          const still = list.some(r => String(r._id) === String(prev.roomId));
          return still ? prev : { ...prev, roomId: '' };
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading available rooms:', err);
          setAvailableRooms([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showModal, newBooking.checkInDate, newBooking.checkOutDate, editingBookingId, roomTypeFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('guestInfo.')) {
      const field = name.split('.')[1];
      setNewBooking(prev => ({
        ...prev,
        guestInfo: { ...prev.guestInfo, [field]: value }
      }));
    } else if (name === 'checkInDate') {
      setNewBooking(prev => {
        const next = { ...prev, checkInDate: value };
        if (value && prev.checkOutDate && prev.checkOutDate <= value) {
          next.checkOutDate = '';
        }
        return next;
      });
    } else {
      setNewBooking(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBooking.checkInDate || !newBooking.checkOutDate) {
      alert('Please select both check-in and check-out dates.');
      return;
    }
    if (newBooking.checkOutDate <= newBooking.checkInDate) {
      alert('Check-out must be after check-in.');
      return;
    }
    if (!newBooking.roomId) {
      alert('Please select an available room.');
      return;
    }
    if (!editingBookingId) {
      if (useExistingGuest && !newBooking.customerId) {
        alert('Please select an existing guest.');
        return;
      }
      if (!useExistingGuest && (!newBooking.guestInfo.fullName?.trim() || !newBooking.guestInfo.phoneNumber?.trim())) {
        alert('Please enter the new guest\'s full name and phone number.');
        return;
      }
    }
    try {
      const bookingData = editingBookingId
        ? {
            roomId: newBooking.roomId,
            checkInDate: newBooking.checkInDate,
            checkOutDate: newBooking.checkOutDate,
            numberOfGuests: parseInt(newBooking.numberOfGuests, 10) || 1,
          }
        : {
            ...(useExistingGuest && newBooking.customerId ? { customerId: newBooking.customerId } : {}),
            ...(!useExistingGuest ? { guestInfo: newBooking.guestInfo } : {}),
            roomId: newBooking.roomId,
            checkInDate: newBooking.checkInDate,
            checkOutDate: newBooking.checkOutDate,
            numberOfGuests: parseInt(newBooking.numberOfGuests, 10) || 1,
          };

      if (editingBookingId) {
        await updateBooking(editingBookingId, bookingData);
        alert('Booking updated successfully!');
      } else {
        await createBooking(bookingData);
        alert('Booking created successfully!');
      }
      setShowModal(false);
      setNewBooking(emptyBookingForm());
      setRoomTypeFilter('');
      setEditingBookingId(null);
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not save booking'));
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking(bookingId);
        alert('Booking cancelled');
      } catch (err) {
        alert('Error: ' + (err.message || 'Could not cancel booking'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return badgeStyles.warning;
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

  const statusLabel = (status) => {
    if (status === 'pending') return 'Pending';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'checked_in') return 'Checked in';
    if (status === 'checked_out') return 'Checked out';
    if (status === 'cancelled') return 'Cancelled';
    return status || '—';
  };

  if (isLoading && bookings.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Header + Add Button */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Calendar size={24} />
          Booking management
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditingBookingId(null);
            setNewBooking(emptyBookingForm());
            setUseExistingGuest(true);
            setRoomTypeFilter('');
            setShowModal(true);
          }}
          className={buttonStyles.primary}
        >
          <Plus size={24} />
          New booking
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={dashboardStyles.bookingFilterBar}>
        <div className={dashboardStyles.bookingFilterLabel}>
          <Filter size={18} aria-hidden />
          <span>Filter by status:</span>
        </div>

        <div className={dashboardStyles.pillRow}>
          {[
            { value: 'all', label: 'All', count: statusCounts.all },
            { value: 'pending', label: 'Pending', count: statusCounts.pending },
            { value: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
            { value: 'checked_in', label: 'Checked in', count: statusCounts.checked_in },
            { value: 'checked_out', label: 'Checked out', count: statusCounts.checked_out },
            { value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`${dashboardStyles.pillBtn} ${statusFilter === option.value ? dashboardStyles.pillBtnActive : ''}`}
            >
              <span>{option.label}</span>
              {option.count > 0 && (
                <span className={dashboardStyles.pillCount}>{option.count}</span>
              )}
            </button>
          ))}
        </div>

        {statusFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`${buttonStyles.base} ${buttonStyles.sm} ${buttonStyles.secondary}`}
            title="Clear filter"
          >
            <X size={14} aria-hidden />
            Clear filter
          </button>
        )}
      </div>

      <div className={`${dashboardStyles.gridAutoMin150} ${dashboardStyles.mbLg}`}>
        <div className={dashboardStyles.miniStatCard}>
          <div className={dashboardStyles.miniStatLabel}>Total bookings</div>
          <div className={dashboardStyles.miniStatValue}>{statusCounts.all}</div>
        </div>
        <div className={dashboardStyles.miniStatCard}>
          <div className={dashboardStyles.miniStatLabel}>Confirmed</div>
          <div className={dashboardStyles.miniStatValueBlue}>{statusCounts.confirmed}</div>
        </div>
        <div className={dashboardStyles.miniStatCard}>
          <div className={dashboardStyles.miniStatLabel}>In house</div>
          <div className={dashboardStyles.miniStatValueGreen}>{statusCounts.checked_in}</div>
        </div>
        <div className={dashboardStyles.miniStatCard}>
          <div className={dashboardStyles.miniStatLabel}>Cancelled</div>
          <div className={dashboardStyles.miniStatValueDanger}>{statusCounts.cancelled}</div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th><Calendar size={16} /> ID</th>
              <th><User size={16} /> Guest</th>
              <th><Bed size={16} /> Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th><DollarSign size={16} /> Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="8" className={dashboardStyles.tableEmptyCell}>
                  {statusFilter === 'all' 
                    ? 'No bookings yet'
                    : `No bookings with status "${[
                        { value: 'pending', label: 'Pending' },
                        { value: 'confirmed', label: 'Confirmed' },
                        { value: 'checked_in', label: 'Checked in' },
                        { value: 'checked_out', label: 'Checked out' },
                        { value: 'cancelled', label: 'Cancelled' }
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
                    {formatViDate(booking.checkInDate)}
                  </td>
                  <td className={styles.date}>
                    {formatViDate(booking.checkOutDate)}
                  </td>
                  <td>
                    <span className={`${badgeStyles.badge} ${getStatusBadgeClass(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </td>
                  <td className={styles.price}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(booking.totalPrice || 0)}
                  </td>
                  <td className={styles.actions}>
                    <div className={dashboardStyles.rowActions}>
                      <button
                        title="Edit"
                        className={buttonStyles.secondary}
                        onClick={() => {
                          // populate modal with booking data for edit
                          setEditingBookingId(booking._id);
                          setShowModal(true);
                          setUseExistingGuest(!!booking.guest);
                          setRoomTypeFilter('');
                          setNewBooking({
                            customerId: booking.guest?._id || booking.guest || '',
                            guestInfo: {
                              fullName: booking.guest?.fullName || '',
                              phoneNumber: booking.guest?.phoneNumber || '',
                              email: booking.guest?.email || ''
                            },
                            roomId: booking.room?._id || booking.room,
                            checkInDate: toDateInputValue(booking.checkInDate),
                            checkOutDate: toDateInputValue(booking.checkOutDate),
                            numberOfGuests: booking.numberOfGuests || 1
                          });
                        }}
                      >
                        <Edit size={14} />
                      </button>

                      <button 
                        className={styles.deleteBtn} 
                        title="Cancel"
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

      {/* Booking form modal — portaled to document.body so <input type="date"> popovers are not clipped */}
      {showModal && createPortal(
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowModal(false);
            setEditingBookingId(null);
            setRoomTypeFilter('');
          }}
        >
          <div className={`${styles.modal} ${styles.modalBooking}`} onClick={e => e.stopPropagation()}>
            <h3>{editingBookingId ? 'Edit booking' : 'New booking'}</h3>

            <form onSubmit={handleSubmit} className={styles.formContainer}>
              <div className={styles.formGrid}>
                {!editingBookingId && (
                  <div className={styles.bookingGuestBlock}>
                    <div>
                      <span className={dashboardStyles.formLabel}>Guest</span>
                      <div className={dashboardStyles.pillRow} role="group" aria-label="Guest type">
                        <button
                          type="button"
                          className={`${dashboardStyles.pillBtn} ${useExistingGuest ? dashboardStyles.pillBtnActive : ''}`}
                          aria-pressed={useExistingGuest}
                          onClick={() => setUseExistingGuest(true)}
                        >
                          Existing guest
                        </button>
                        <button
                          type="button"
                          className={`${dashboardStyles.pillBtn} ${!useExistingGuest ? dashboardStyles.pillBtnActive : ''}`}
                          aria-pressed={!useExistingGuest}
                          onClick={() => setUseExistingGuest(false)}
                        >
                          New guest
                        </button>
                      </div>
                    </div>

                    {useExistingGuest ? (
                      <div className={styles.bookingGuestFields}>
                        <label className={dashboardStyles.formLabel} htmlFor="booking-customer-id">
                          Select guest <span className={dashboardStyles.reqStar}>*</span>
                        </label>
                        <select
                          id="booking-customer-id"
                          name="customerId"
                          className={dashboardStyles.formInputDark}
                          value={newBooking.customerId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">— Choose from list —</option>
                          {guests.map(guest => (
                            <option key={guest._id} value={guest._id}>
                              {guest.fullName} · {guest.phoneNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className={styles.bookingGuestFields}>
                        <div>
                          <label className={dashboardStyles.formLabel} htmlFor="booking-guest-name">
                            Full name <span className={dashboardStyles.reqStar}>*</span>
                          </label>
                          <input
                            id="booking-guest-name"
                            type="text"
                            name="guestInfo.fullName"
                            className={dashboardStyles.formInputDark}
                            value={newBooking.guestInfo.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        <div>
                          <label className={dashboardStyles.formLabel} htmlFor="booking-guest-phone">
                            Phone <span className={dashboardStyles.reqStar}>*</span>
                          </label>
                          <input
                            id="booking-guest-phone"
                            type="text"
                            name="guestInfo.phoneNumber"
                            className={dashboardStyles.formInputDark}
                            value={newBooking.guestInfo.phoneNumber}
                            onChange={handleChange}
                            placeholder="e.g. 0901234567"
                            required
                          />
                        </div>
                        <div>
                          <label className={dashboardStyles.formLabel} htmlFor="booking-guest-email">
                            Email <span className={dashboardStyles.textMutedHint}>(optional)</span>
                          </label>
                          <input
                            id="booking-guest-email"
                            type="email"
                            name="guestInfo.email"
                            className={dashboardStyles.formInputDark}
                            value={newBooking.guestInfo.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {editingBookingId && (
                  <div className={dashboardStyles.formHintFullWidth}>
                    Edit room, dates, and guest count only. To change the guest or status, use the appropriate workflow.
                  </div>
                )}

                <div className={styles.bookingDatesBlock}>
                  <div className={styles.bookingDatesFields}>
                    <div className={styles.bookingDateField}>
                      <label htmlFor="booking-check-in">Check-in</label>
                      <input
                        id="booking-check-in"
                        type="date"
                        name="checkInDate"
                        className={`${dashboardStyles.formInputDark} ${styles.dateInput}`}
                        value={newBooking.checkInDate}
                        onChange={handleChange}
                        max={newBooking.checkOutDate || undefined}
                        required
                      />
                    </div>
                    <div className={styles.bookingDateField}>
                      <label htmlFor="booking-check-out">Check-out</label>
                      <input
                        id="booking-check-out"
                        type="date"
                        name="checkOutDate"
                        className={`${dashboardStyles.formInputDark} ${styles.dateInput}`}
                        value={newBooking.checkOutDate}
                        onChange={handleChange}
                        required
                        min={minCheckoutDate || undefined}
                      />
                    </div>
                  </div>
                  <p className={`${styles.bookingDatesHint}`}>
                    Check-out must be at least one night after check-in.
                  </p>
                </div>
                <div>
                  <label className={dashboardStyles.formLabel} htmlFor="booking-room-type-filter">Room type (filter)</label>
                  <select
                    id="booking-room-type-filter"
                    className={dashboardStyles.formInputDark}
                    value={roomTypeFilter}
                    onChange={(e) => {
                      setRoomTypeFilter(e.target.value);
                      setNewBooking(prev => ({ ...prev, roomId: '' }));
                    }}
                  >
                    <option value="">All room types</option>
                    {roomTypes.map(rt => (
                      <option key={rt._id} value={rt._id}>{rt.typeName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={dashboardStyles.formLabel} htmlFor="booking-room-select">Room</label>
                  <select
                    id="booking-room-select"
                    name="roomId"
                    className={dashboardStyles.formInputDark}
                    value={newBooking.roomId}
                    onChange={handleChange}
                    required
                    disabled={!newBooking.checkInDate || !newBooking.checkOutDate}
                  >
                    <option value="">
                      {newBooking.checkInDate &&
                      newBooking.checkOutDate &&
                      availableRooms.length === 0
                        ? 'No vacant rooms for these dates'
                        : 'Select a room'}
                    </option>
                    {availableRooms.map(room => (
                      <option key={room._id} value={room._id}>
                        {room.roomNumber} - {room.roomType?.typeName || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={dashboardStyles.formLabel} htmlFor="booking-num-guests">Guests</label>
                  <input
                    id="booking-num-guests"
                    type="number"
                    name="numberOfGuests"
                    className={dashboardStyles.formInputDark}
                    value={newBooking.numberOfGuests}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={buttonStyles.primary}>Save</button>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={() => {
                    setShowModal(false);
                    setEditingBookingId(null);
                    setRoomTypeFilter('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BookingsTab;

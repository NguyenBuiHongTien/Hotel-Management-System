import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, RefreshCw, Eye } from 'lucide-react';
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

  const toLocalDateKey = (input) => {
    const d = new Date(input);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = toLocalDateKey(new Date());

  // Auto-refresh every 30s to stay in sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showDetailModal && !isProcessing) {
        refetch();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch, showDetailModal, isProcessing]);

  // Filter bookings for check-in (confirmed status)
  const getCheckInBookings = () => {
    let filtered = bookings.filter(booking => booking.status === 'confirmed');
    
    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(booking => {
        const checkInDate = toLocalDateKey(booking.checkInDate);
        return checkInDate === today;
      });
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(booking => {
        const checkInDate = toLocalDateKey(booking.checkInDate);
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
        const checkOutDate = toLocalDateKey(booking.checkOutDate);
        return checkOutDate === today;
      });
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(booking => {
        const checkOutDate = toLocalDateKey(booking.checkOutDate);
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

    const confirmMsg = `Confirm check-in for:\n- Guest: ${booking.guest?.fullName || 'N/A'}\n- Room: ${booking.room?.roomNumber || 'N/A'}\n- Date: ${new Date(booking.checkInDate).toLocaleDateString('en-US')}`;
    
    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      try {
        await bookingService.checkIn(bookingId);
        alert('Check-in successful! The room is now marked as occupied.');
        await refetch();
      } catch (err) {
        alert('Error: ' + (err.message || 'Could not check in'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCheckOut = async (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    const confirmMsg = `Confirm check-out for:\n- Guest: ${booking.guest?.fullName || 'N/A'}\n- Room: ${booking.room?.roomNumber || 'N/A'}\n- Date: ${new Date(booking.checkOutDate).toLocaleDateString('en-US')}\n\nThe room will be set to "Needs cleaning" and an invoice will be created automatically.`;
    
    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      try {
        const result = await bookingService.checkOut(bookingId);
        const amount = result.data?.invoice?.totalAmount ?? booking.totalPrice ?? 0;
        alert(`Check-out successful!\nInvoice created.\nTotal: ₫${Number(amount).toLocaleString('en-US')}`);
        await refetch();
      } catch (err) {
        alert('Error: ' + (err.message || 'Could not check out'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Check-in & Check-out</h2>
        <button
          type="button"
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
          onClick={refetch}
          title="Refresh data"
        >
          <RefreshCw size={16} aria-hidden />
          Refresh
        </button>
      </div>

      <div className={styles.toolbarRowStart}>
        <button
          type="button"
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md} ${activeView === 'checkin' ? buttonStyles.primary : ''}`}
          onClick={() => setActiveView('checkin')}
        >
          <CheckCircle size={18} aria-hidden />
          Check-in ({checkInsAvailable.length})
        </button>
        <button
          type="button"
          className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md} ${activeView === 'checkout' ? buttonStyles.primary : ''}`}
          onClick={() => setActiveView('checkout')}
        >
          <XCircle size={18} aria-hidden />
          Check-out ({checkOutsAvailable.length})
        </button>
      </div>

      <div className={styles.filterBar}>
        <div>
          <label htmlFor="cio-search">Search</label>
          <div className={styles.searchInputWrap}>
            <Search size={18} className={styles.searchIcon} aria-hidden />
            <input
              id="cio-search"
              type="text"
              className={styles.searchField}
              placeholder="Search by name, room, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="cio-date-filter">Date range</label>
          <select
            id="cio-date-filter"
            className={styles.formInputDark}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid2} ${styles.mbLg}`}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Ready for check-in</div>
          <div className={styles.miniStatValueGreen}>{checkInsAvailable.length}</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatLabel}>Ready for check-out</div>
          <div className={styles.miniStatValueDanger}>{checkOutsAvailable.length}</div>
        </div>
      </div>

      {/* Check-in Section */}
      {activeView === 'checkin' && (
        <div className={styles.checkinColumnPanel}>
          <h3 className={styles.checkinColumnTitle}>
            <CheckCircle size={24} className={styles.titleIconSuccess} aria-hidden />
            Check-in list ({checkInsAvailable.length})
          </h3>
          {checkInsAvailable.length === 0 ? (
            <p className={styles.checkinEmpty}>
              No bookings awaiting check-in
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Guest</th>
                    <th className={tableStyles.th}>Phone</th>
                    <th className={tableStyles.th}>Room</th>
                    <th className={tableStyles.th}>Check-in</th>
                    <th className={tableStyles.th}>Check-out</th>
                    <th className={tableStyles.th}>Guests</th>
                    <th className={tableStyles.th}>Total</th>
                    <th className={tableStyles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checkInsAvailable.map(booking => (
                    <tr key={booking._id}>
                      <td className={tableStyles.td}>{booking.guest?.fullName || 'N/A'}</td>
                      <td className={tableStyles.td}>{booking.guest?.phoneNumber || '—'}</td>
                      <td className={tableStyles.td}>
                        <strong>Room {booking.room?.roomNumber || 'N/A'}</strong>
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkInDate).toLocaleDateString('en-US')}
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkOutDate).toLocaleDateString('en-US')}
                      </td>
                      <td className={tableStyles.td}>{booking.numberOfGuests || 1}</td>
                      <td className={tableStyles.td}>
                        ₫{Number(booking.totalPrice || 0).toLocaleString('en-US')}
                      </td>
                      <td className={tableStyles.td}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={`${buttonStyles.primary} ${buttonStyles.sm}`}
                            onClick={() => handleCheckIn(booking._id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle size={14} aria-hidden />
                            Check-in
                          </button>
                          <button
                            className={tableStyles.actionBtn}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            title="View details"
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
        <div className={styles.checkinColumnPanel}>
          <h3 className={styles.checkinColumnTitle}>
            <XCircle size={24} className={styles.titleIconDanger} aria-hidden />
            Check-out list ({checkOutsAvailable.length})
          </h3>
          {checkOutsAvailable.length === 0 ? (
            <p className={styles.checkinEmpty}>
              No bookings awaiting check-out
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Guest</th>
                    <th className={tableStyles.th}>Phone</th>
                    <th className={tableStyles.th}>Room</th>
                    <th className={tableStyles.th}>Check-in</th>
                    <th className={tableStyles.th}>Check-out</th>
                    <th className={tableStyles.th}>Guests</th>
                    <th className={tableStyles.th}>Total</th>
                    <th className={tableStyles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checkOutsAvailable.map(booking => (
                    <tr key={booking._id}>
                      <td className={tableStyles.td}>{booking.guest?.fullName || 'N/A'}</td>
                      <td className={tableStyles.td}>{booking.guest?.phoneNumber || '—'}</td>
                      <td className={tableStyles.td}>
                        <strong>Room {booking.room?.roomNumber || 'N/A'}</strong>
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkInDate).toLocaleDateString('en-US')}
                      </td>
                      <td className={tableStyles.td}>
                        {new Date(booking.checkOutDate).toLocaleDateString('en-US')}
                      </td>
                      <td className={tableStyles.td}>{booking.numberOfGuests || 1}</td>
                      <td className={tableStyles.td}>
                        ₫{Number(booking.totalPrice || 0).toLocaleString('en-US')}
                      </td>
                      <td className={tableStyles.td}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.btnDangerSolid}
                            onClick={() => handleCheckOut(booking._id)}
                            disabled={isProcessing}
                          >
                            <XCircle size={14} aria-hidden />
                            Check-out
                          </button>
                          <button
                            className={tableStyles.actionBtn}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            title="View details"
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
          <div className={`${styles.modal} ${styles.modalMax600}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>Booking details</h2>
            <div className={styles.modalFormStack}>
              <div>
                <strong>Guest:</strong> {selectedBooking.guest?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Phone:</strong> {selectedBooking.guest?.phoneNumber || '—'}
              </div>
              <div>
                <strong>Email:</strong> {selectedBooking.guest?.email || '—'}
              </div>
              <div>
                <strong>Room:</strong> {selectedBooking.room?.roomNumber || 'N/A'} 
                {selectedBooking.room?.roomType && ` (${selectedBooking.room.roomType.typeName})`}
              </div>
              <div>
                <strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toLocaleDateString('en-US')}
              </div>
              <div>
                <strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toLocaleDateString('en-US')}
              </div>
              <div>
                <strong>Guests:</strong> {selectedBooking.numberOfGuests || 1}
              </div>
              <div>
                <strong>Total:</strong> ₫{Number(selectedBooking.totalPrice || 0).toLocaleString('en-US')}
              </div>
              <div>
                <strong>Status:</strong>
                <span className={`${badgeStyles.badge} ${
                  selectedBooking.status === 'confirmed' ? badgeStyles.info :
                  selectedBooking.status === 'checked_in' ? badgeStyles.success :
                  selectedBooking.status === 'checked_out' ? badgeStyles.secondary : ''
                } ${styles.badgeSpacer}`}>
                  {selectedBooking.status === 'confirmed' ? 'Confirmed' :
                   selectedBooking.status === 'checked_in' ? 'Checked in' :
                   selectedBooking.status === 'checked_out' ? 'Checked out' :
                   selectedBooking.status === 'cancelled' ? 'Cancelled' : selectedBooking.status}
                </span>
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              {selectedBooking.status === 'confirmed' && (
                <button
                  type="button"
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
                  type="button"
                  className={styles.btnDangerSolid}
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
                type="button"
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBooking(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOutTab;

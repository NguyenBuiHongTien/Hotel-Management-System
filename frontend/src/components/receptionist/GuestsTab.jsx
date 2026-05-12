import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Search, Trash2 } from 'lucide-react';
import { guestService } from '../../services/guestService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import buttonStyles from '../../styles/Button.module.css';

const GuestsTab = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: ''
  });

  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) {
        const term = searchTerm.trim();
        if (/^\d{3,}$/.test(term)) {
          filters.phoneNumber = term;
        } else {
          filters.name = term;
        }
      }
      const data = await guestService.getAllGuests(filters);
      setGuests(asArray(data, 'guests'));
    } catch (err) {
      console.error('Error loading guests:', err);
      alert('Could not load guests');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGuests();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadGuests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuestId) {
        await guestService.updateGuest(editingGuestId, formData);
        alert('Guest updated successfully!');
      } else {
        await guestService.createGuest(formData);
        alert('Guest created successfully!');
      }
      setShowModal(false);
      setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
      setEditingGuestId(null);
      loadGuests();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not save guest'));
    }
  };

  const handleEdit = (guest) => {
    setEditingGuestId(guest._id);
    setFormData({
      fullName: guest.fullName || '',
      phoneNumber: guest.phoneNumber || '',
      email: guest.email || '',
      address: guest.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (guest) => {
    const displayName = guest.fullName || guest.customerId || guest._id?.slice(-6) || 'this guest';
    if (!window.confirm(`Delete "${displayName}"?`)) {
      return;
    }

    try {
      await guestService.deleteGuest(guest._id);
      alert('Guest deleted successfully!');
      loadGuests();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not delete guest'));
    }
  };

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Guests</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingGuestId(null);
            setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
            setShowModal(true);
          }}
        >
          <Plus size={18} aria-hidden />
          Add guest
        </button>
      </div>

      <div className={styles.searchInputWrap}>
        <Search size={20} className={styles.searchIcon} aria-hidden />
        <input
          type="text"
          className={styles.searchField}
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Guest ID</th>
              <th className={tableStyles.th}>Full name</th>
              <th className={tableStyles.th}>Phone</th>
              <th className={tableStyles.th}>Email</th>
              <th className={tableStyles.th}>Address</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Loading...</td></tr>
            ) : guests.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>No guests</td></tr>
            ) : (
              guests.map(guest => (
                <tr key={guest._id}>
                  <td className={tableStyles.td}>#{guest.customerId || guest._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>{guest.fullName}</td>
                  <td className={tableStyles.td}>{guest.phoneNumber}</td>
                  <td className={tableStyles.td}>{guest.email || '—'}</td>
                  <td className={tableStyles.td}>{guest.address || '—'}</td>
                  <td className={tableStyles.td}>
                    <div className={styles.rowActions}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleEdit(guest)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleDelete(guest)}
                        title="Delete guest"
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

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>{editingGuestId ? 'Edit guest' : 'Add guest'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalFormStack}>
                <div>
                  <label className={styles.formLabel}>
                    Full name <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInputDark}
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Phone <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.formInputDark}
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Email
                  </label>
                  <input
                    type="email"
                    className={styles.formInputDark}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Address
                  </label>
                  <textarea
                    className={styles.textareaDark}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className={styles.modalFooterBar}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingGuestId(null);
                    setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingGuestId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestsTab;

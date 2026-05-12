import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { roomTypeService } from '../../services/roomTypeService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import buttonStyles from '../../styles/Button.module.css';

const RoomTypesTab = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [formData, setFormData] = useState({
    typeName: '',
    description: '',
    basePrice: '',
    capacity: '',
    amenities: []
  });

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await roomTypeService.getAllRoomTypes();
      setRoomTypes(asArray(data, 'roomTypes'));
    } catch (err) {
      console.error('Error loading room types:', err);
      alert('Could not load room types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        capacity: Number(formData.capacity),
        amenities: (formData.amenities || []).filter(a => a.trim() !== '')
      };

      if (editingRoomTypeId) {
        await roomTypeService.updateRoomType(editingRoomTypeId, payload);
        alert('Room type updated!');
      } else {
        await roomTypeService.createRoomType(payload);
        alert('Room type created!');
      }
      setShowModal(false);
      setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
      setEditingRoomTypeId(null);
      loadRoomTypes();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not save room type'));
    }
  };

  const handleEdit = (roomType) => {
    setEditingRoomTypeId(roomType._id);
    setFormData({
      typeName: roomType.typeName || '',
      description: roomType.description || '',
      basePrice: roomType.basePrice || '',
      capacity: roomType.capacity || '',
      amenities: roomType.amenities || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room type?')) {
      try {
        await roomTypeService.deleteRoomType(id);
        alert('Room type deleted!');
        loadRoomTypes();
      } catch (err) {
        alert('Error: ' + (err.message || 'Could not delete room type'));
      }
    }
  };

  const handleAmenityChange = (index, value) => {
    const base = formData.amenities || [];
    const newAmenities = [...base];
    newAmenities[index] = value;
    setFormData({ ...formData, amenities: newAmenities });
  };

  const addAmenityField = () => {
    const base = formData.amenities || [];
    setFormData({ ...formData, amenities: [...base, ''] });
  };

  const removeAmenityField = (index) => {
    const base = formData.amenities || [];
    const newAmenities = base.filter((_, i) => i !== index);
    setFormData({ ...formData, amenities: newAmenities });
  };

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Room types</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingRoomTypeId(null);
            setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
            setShowModal(true);
          }}
        >
          <Plus size={18} aria-hidden />
          Add room type
        </button>
      </div>

      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Name</th>
              <th className={tableStyles.th}>Description</th>
              <th className={tableStyles.th}>Base price</th>
              <th className={tableStyles.th}>Capacity</th>
              <th className={tableStyles.th}>Amenities</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Loading...</td></tr>
            ) : roomTypes.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>No room types</td></tr>
            ) : (
              roomTypes.map(rt => (
                <tr key={rt._id}>
                  <td className={tableStyles.td}>{rt.typeName}</td>
                  <td className={tableStyles.td}>{rt.description || '—'}</td>
                  <td className={tableStyles.td}>₫{Number(rt.basePrice || 0).toLocaleString('en-US')}</td>
                  <td className={tableStyles.td}>{rt.capacity}</td>
                  <td className={tableStyles.td}>
                    <div className={styles.rowActions}>
                      {(rt.amenities || []).slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className={styles.amenityChip}>
                          {amenity}
                        </span>
                      ))}
                      {(rt.amenities || []).length > 3 && (
                        <span className={styles.amenityMore}>
                          +{(rt.amenities || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    <div className={styles.rowActions}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleEdit(rt)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${tableStyles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDelete(rt._id)}
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
          <div className={`${styles.modal} ${styles.modalMax600} ${styles.modalScrollable}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalFormTitle}>{editingRoomTypeId ? 'Edit room type' : 'New room type'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalFormStack}>
                <div>
                  <label className={styles.formLabel}>
                    Type name <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInputDark}
                    required
                    value={formData.typeName}
                    onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Description
                  </label>
                  <textarea
                    className={styles.textareaDark}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className={styles.gridForm2}>
                  <div>
                    <label className={styles.formLabel}>
                      Base price (₫) <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="number"
                      className={styles.formInputDark}
                      required
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>
                      Capacity <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="number"
                      className={styles.formInputDark}
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={styles.formLabel}>
                    Amenities
                  </label>
                  {(formData.amenities || []).map((amenity, index) => (
                    <div key={index} className={styles.formRowInline}>
                      <input
                        type="text"
                        className={`${styles.formInputDark} ${styles.inputGrow}`}
                        value={amenity}
                        onChange={(e) => handleAmenityChange(index, e.target.value)}
                        placeholder="e.g. WiFi, minibar..."
                      />
                      <button
                        type="button"
                        className={`${buttonStyles.base} ${buttonStyles.danger} ${buttonStyles.sm}`}
                        onClick={() => removeAmenityField(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAmenityField}
                    className={`${buttonStyles.secondary} ${buttonStyles.sm}`}
                  >
                    + Add amenity
                  </button>
                </div>
              </div>
              <div className={styles.modalFooterBar}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoomTypeId(null);
                    setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingRoomTypeId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypesTab;

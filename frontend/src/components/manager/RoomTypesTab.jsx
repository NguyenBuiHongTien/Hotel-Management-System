import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { roomTypeService } from '../../services/roomTypeService';
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
      setRoomTypes(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading room types:', err);
      alert('Không thể tải danh sách loại phòng');
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
        amenities: formData.amenities.filter(a => a.trim() !== '')
      };

      if (editingRoomTypeId) {
        await roomTypeService.updateRoomType(editingRoomTypeId, payload);
        alert('Cập nhật loại phòng thành công!');
      } else {
        await roomTypeService.createRoomType(payload);
        alert('Tạo loại phòng mới thành công!');
      }
      setShowModal(false);
      setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
      setEditingRoomTypeId(null);
      loadRoomTypes();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể lưu loại phòng'));
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
    if (window.confirm('Bạn có chắc muốn xóa loại phòng này?')) {
      try {
        await roomTypeService.deleteRoomType(id);
        alert('Xóa loại phòng thành công!');
        loadRoomTypes();
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể xóa loại phòng'));
      }
    }
  };

  const handleAmenityChange = (index, value) => {
    const newAmenities = [...formData.amenities];
    newAmenities[index] = value;
    setFormData({ ...formData, amenities: newAmenities });
  };

  const addAmenityField = () => {
    setFormData({ ...formData, amenities: [...formData.amenities, ''] });
  };

  const removeAmenityField = (index) => {
    const newAmenities = formData.amenities.filter((_, i) => i !== index);
    setFormData({ ...formData, amenities: newAmenities });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Quản lý loại phòng</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => {
            setEditingRoomTypeId(null);
            setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
            setShowModal(true);
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Thêm loại phòng
        </button>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Tên loại</th>
              <th className={tableStyles.th}>Mô tả</th>
              <th className={tableStyles.th}>Giá cơ bản</th>
              <th className={tableStyles.th}>Sức chứa</th>
              <th className={tableStyles.th}>Tiện ích</th>
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={6}>Đang tải...</td></tr>
            ) : roomTypes.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={6}>Không có loại phòng nào</td></tr>
            ) : (
              roomTypes.map(rt => (
                <tr key={rt._id}>
                  <td className={tableStyles.td}>{rt.typeName}</td>
                  <td className={tableStyles.td}>{rt.description || '—'}</td>
                  <td className={tableStyles.td}>₫{Number(rt.basePrice || 0).toLocaleString()}</td>
                  <td className={tableStyles.td}>{rt.capacity}</td>
                  <td className={tableStyles.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(rt.amenities || []).slice(0, 3).map((amenity, idx) => (
                        <span key={idx} style={{
                          background: '#e5e7eb',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          {amenity}
                        </span>
                      ))}
                      {(rt.amenities || []).length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          +{(rt.amenities || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleEdit(rt)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => handleDelete(rt._id)}
                        title="Xóa"
                        style={{ color: '#ef4444' }}
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingRoomTypeId ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Tên loại phòng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.typeName}
                    onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                      Giá cơ bản (₫) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                      Sức chứa <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Tiện ích
                  </label>
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={amenity}
                        onChange={(e) => handleAmenityChange(index, e.target.value)}
                        placeholder="Ví dụ: wifi, tv, ac..."
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAmenityField(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAmenityField}
                    className={`${buttonStyles.secondary} ${buttonStyles.sm}`}
                  >
                    + Thêm tiện ích
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoomTypeId(null);
                    setFormData({ typeName: '', description: '', basePrice: '', capacity: '', amenities: [] });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`${buttonStyles.primary} ${buttonStyles.md}`}
                >
                  {editingRoomTypeId ? 'Cập nhật' : 'Tạo mới'}
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


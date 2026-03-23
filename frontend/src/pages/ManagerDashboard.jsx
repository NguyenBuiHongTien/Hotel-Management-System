import React, { useState, useEffect } from 'react';
import { UserCheck, Bed, Users, DollarSign, Calendar, CheckCircle, X, FileText, Home, Settings } from 'lucide-react';
import NavBar from '../components/NavBar';
import StatCard from '../components/StatCard';
import styles from '../styles/Dashboard.module.css';
import { apiCall } from '../config/api';
import RoomsManagementTab from '../components/manager/RoomsManagementTab';
import RoomTypesTab from '../components/manager/RoomTypesTab';
import ReportsTab from '../components/manager/ReportsTab';

const ManagerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // mặc định tab dashboard

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist'
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  // (Employee stats are derived from loaded employees)

  // State cho dữ liệu thực từ backend
  const [totalRooms, setTotalRooms] = useState(null);
  const [occupiedRooms, setOccupiedRooms] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [totalInvoices, setTotalInvoices] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  // Employees list for staff tab
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await (async () => {
        try {
          const mod = await import('../services/employeeService');
          const svc = mod.default || mod.employeeService || mod;
          return await svc.getEmployees();
        } catch (e) {
          return await apiCall('/employees');
        }
      })();
      setEmployees(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Failed to load employees', err);
      setDataError('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDashboard = async () => {
    setLoadingData(true);
    setDataError('');
    try {
      // 1) Lấy trạng thái phòng (real-time)
      const roomsResp = await (async () => {
        try {
          const mod = await import('../services/roomService');
          const svc = mod.default || mod.roomService || mod;
          return await svc.getRealtimeRoomStatus();
        } catch (e) {
          return await apiCall('/rooms/status/realtime');
        }
      })();
      if (roomsResp) {
        setTotalRooms(roomsResp.totalRooms ?? 0);
        const occupied = (roomsResp.statsByStatus || []).find(s => s._id === 'occupied');
        setOccupiedRooms(occupied ? occupied.count : 0);
      }

      // 2) Lấy doanh thu nhanh cho dashboard
      const revenueResp = await (async () => {
        try {
          const mod = await import('../services/dashboardService');
          const svc = mod.default || mod.dashboardService || mod;
          return await svc.getRevenue();
        } catch (e) {
          return await apiCall('/dashboard/revenue');
        }
      })();
      if (revenueResp) {
        setRevenue(revenueResp.totalRevenue ?? 0);
        setTotalInvoices(revenueResp.totalInvoices ?? 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDataError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    
    // Auto-refresh mỗi 30 giây để đồng bộ trạng thái phòng
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchDashboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Xử lý mở/đóng modal
  const openModal = () => {
    setEditingEmployeeId(null);
    setFormData({ name: '', email: '', password: '', role: 'receptionist' });
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: 'receptionist' });
    setEditingEmployeeId(null);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý lưu (chỉ đóng modal, có thể mở rộng sau)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create employee via API
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password ? { password: formData.password } : {}),
      };
      if (editingEmployeeId) {
        try {
          const mod = await import('../services/employeeService');
          const svc = mod.default || mod.employeeService || mod;
          await svc.updateEmployee(editingEmployeeId, payload);
        } catch (e) {
          await apiCall(`/employees/${editingEmployeeId}`, { method: 'PUT', body: JSON.stringify(payload) });
        }
      } else {
        try {
          const mod = await import('../services/employeeService');
          const svc = mod.default || mod.employeeService || mod;
          await svc.createEmployee(payload);
        } catch (e) {
          await apiCall('/employees', { method: 'POST', body: JSON.stringify(payload) });
        }
      }
      closeModal();
      await loadEmployees();
      setEditingEmployeeId(null);
    } catch (err) {
      console.error('Create employee failed', err);
      alert('Không thể tạo nhân viên: ' + (err.message || ''));
    }
  };

  useEffect(() => {
    if (activeTab === 'staff') {
      loadEmployees();
    }
  }, [activeTab]);

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Bạn có muốn xóa nhân viên này không?')) return;
    try {
      try {
        const mod = await import('../services/employeeService');
        const svc = mod.default || mod.employeeService || mod;
        await svc.deleteEmployee(id);
      } catch (e) {
        await apiCall(`/employees/${id}`, { method: 'DELETE' });
      }
      await loadEmployees();
    } catch (err) {
      console.error(err);
      alert('Không thể xóa nhân viên');
    }
  };

  return (
    <div className={styles.container}>
      <NavBar title="Quản lý" icon={UserCheck} onLogout={onLogout} />

      <div className={styles.content}>
        {/* Tabs chuyển đổi */}
        <div className={styles.tabNav}>
          {[
            { id: 'dashboard', label: 'Tổng quan', icon: Home },
            { id: 'report', label: 'Báo cáo', icon: FileText },
            { id: 'staff', label: 'Nhân viên', icon: Users },
            { id: 'rooms', label: 'Phòng', icon: Bed },
            { id: 'roomtypes', label: 'Loại phòng', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              >
                <Icon size={18} className={styles.tabIcon} />
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
          {activeTab === 'staff' && (
            <button className={styles.addEmployeeButton} onClick={openModal} style={{ marginLeft: 'auto' }}>
              + Thêm nhân viên
            </button>
          )}
        </div>

        {/* Nội dung từng tab */}
        {activeTab === 'dashboard' && (
          <>
            <h2 className={styles.sectionTitle}>Tổng quan hệ thống</h2>
              <div>
                {dataError && (
                  <div style={{ color: '#dc2626', marginBottom: '0.75rem' }}>Lỗi tải dữ liệu: {dataError}</div>
                )}
                <div className={`${styles.grid} ${styles.grid4}`}>
                <StatCard
                  title="Tổng phòng"
                  value={loadingData ? 'Đang tải...' : (totalRooms != null ? totalRooms : '—')}
                  icon={Bed}
                  iconColor="text-blue-600"
                />

                <StatCard
                  title="Phòng đang sử dụng"
                  value={loadingData ? 'Đang tải...' : (occupiedRooms != null ? occupiedRooms : '—')}
                  icon={Users}
                  iconColor="text-green-600"
                />

                <StatCard
                  title="Doanh thu"
                  value={loadingData ? 'Đang tải...' : (revenue != null ? `₫${Number(revenue).toLocaleString()}` : '—')}
                  icon={DollarSign}
                  iconColor="text-green-600"
                />

                <StatCard
                  title="Tỷ lệ lấp đầy"
                  value={
                    loadingData
                      ? 'Đang tải...'
                      : (totalRooms ? `${Math.round(((occupiedRooms || 0) / totalRooms) * 100)}%` : '—')
                  }
                  icon={Calendar}
                  iconColor="text-purple-600"
                />
                </div>
              </div>

            <div className={`${styles.grid}`} style={{ gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>Trạng thái phòng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {loadingData ? (
                    <p style={{ color: '#6b7280' }}>Đang tải...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tổng phòng</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{totalRooms || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Đang sử dụng</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{occupiedRooms || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tỷ lệ lấp đầy</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
                          {totalRooms ? `${Math.round(((occupiedRooms || 0) / totalRooms) * 100)}%` : '0%'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Hóa đơn đã thanh toán</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7c3aed' }}>{totalInvoices || 0}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'report' && (
          <ReportsTab />
        )}

        {activeTab === 'rooms' && (
          <RoomsManagementTab />
        )}

        {activeTab === 'roomtypes' && (
          <RoomTypesTab />
        )}

        {activeTab === 'staff' && (
          <>
            <h2>Quản lý Nhân sự</h2>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {/* Simple stats from loaded employees */}
              <div style={{ backgroundColor: 'white', flex: 1, padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#e9d5ff', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{employees.length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Tổng nhân viên</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', flex: 1, padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fee2e2', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={24} color="#dc2626" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{employees.filter(e=>e.role==='manager').length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Quản trị viên</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', flex: 1, padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#dbeafe', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={24} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{employees.filter(e=>e.role && e.role !== 'manager').length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Nhân viên</div>
                </div>
              </div>
            </div>

            {/* Các tab con danh sách nhân viên, chấm công, bảng lương */}
            <div style={{ marginTop: '1.5rem' }}>
              {/* Giả sử chỉ demo tab "Danh sách nhân viên" */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #7c3aed', paddingBottom: '0.5rem', fontWeight: 600, color: '#7c3aed' }}>
                Danh sách nhân viên
              </div>

              <input
                type="text"
                placeholder="Tìm kiếm nhân viên theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '300px',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  marginBottom: '1rem',
                }}
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  marginLeft: '1rem',
                }}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="manager">Quản lý</option>
                <option value="receptionist">Lễ tân</option>
                <option value="housekeeper">Buồng phòng</option>
                <option value="maintenance">Bảo trì</option>
                <option value="accountant">Kế toán</option>
              </select>

              {/* Bảng danh sách nhân viên */}
              <div style={{ marginTop: '2rem' }}>
                {loadingEmployees ? (
                  <p>Đang tải danh sách nhân viên...</p>
                ) : employees.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <p>Chưa có nhân viên nào</p>
                    <p>Hãy thêm nhân viên đầu tiên</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {(
                      employees || []
                    )
                      .filter(emp => {
                        // role filter
                        if (roleFilter && roleFilter !== 'all' && emp.role !== roleFilter) return false;
                        // search filter (name or email)
                        if (!searchTerm) return true;
                        const q = searchTerm.toLowerCase();
                        const name = (emp.name || '').toLowerCase();
                        const email = (emp.email || '').toLowerCase();
                        return name.includes(q) || email.includes(q);
                      })
                      .map(emp => (
                      <div key={emp._id} style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{emp.email} · {emp.role}</div>
                        </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => {
                                  setEditingEmployeeId(emp._id);
                                  setFormData({ name: emp.name || '', email: emp.email || '', password: '', role: emp.role || 'receptionist' });
                                  setIsModalOpen(true);
                                }}
                                style={{ background: '#3b82f6', color: 'white', padding: '0.5rem', borderRadius: '0.375rem' }}
                              >Sửa</button>

                              <button onClick={() => handleDeleteEmployee(emp._id)} style={{ background: '#ef4444', color: 'white', padding: '0.5rem', borderRadius: '0.375rem' }}>Xóa</button>
                            </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal Thêm Nhân Viên */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }} onClick={closeModal}>
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                  {editingEmployeeId ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </h3>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Email <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Ví dụ: abc@hotel.com"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Mật khẩu {editingEmployeeId ? <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>(để trống nếu không đổi)</span> : <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingEmployeeId}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Ít nhất 6 ký tự"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Vai trò <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="manager">Quản lý</option>
                        <option value="receptionist">Lễ tân</option>
                        <option value="housekeeper">Buồng phòng</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="accountant">Kế toán</option>
                      </select>
                    </div>
                  </div>

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: '#7c3aed',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6d28d9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  >
                    Lưu nhân viên
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
import React, { useState, useEffect } from 'react';
import { UserCheck, Bed, Users, DollarSign, Calendar, X, FileText, Home, Settings } from 'lucide-react';
import NavBar from '../components/NavBar';
import StatCard from '../components/StatCard';
import styles from '../styles/Dashboard.module.css';
import { apiCall } from '../config/api';
import { employeeService } from '../services/employeeService';
import { roomService } from '../services/roomService';
import { dashboardService } from '../services/dashboardService';
import { asArray } from '../utils/apiNormalize';
import RoomsManagementTab from '../components/manager/RoomsManagementTab';
import RoomTypesTab from '../components/manager/RoomTypesTab';
import ReportsTab from '../components/manager/ReportsTab';

const ManagerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist'
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [totalRooms, setTotalRooms] = useState(null);
  const [occupiedRooms, setOccupiedRooms] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [totalInvoices, setTotalInvoices] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await employeeService.getEmployees();
      setEmployees(asArray(data, 'employees'));
    } catch (err) {
      console.error('Failed to load employees', err);
      try {
        const raw = await apiCall('/employees');
        setEmployees(asArray(raw, 'employees'));
      } catch (e2) {
        setDataError('Could not load employees');
        setEmployees([]);
      }
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDashboard = async () => {
    setLoadingData(true);
    setDataError('');
    try {
      const roomsResp = await roomService.getRealtimeRoomStatus();
      if (roomsResp) {
        setTotalRooms(roomsResp.totalRooms ?? 0);
        const occupied = (roomsResp.statsByStatus || []).find(s => s._id === 'occupied');
        setOccupiedRooms(occupied ? occupied.count : 0);
      }

      const revenueResp = await dashboardService.getRevenue();
      if (revenueResp) {
        setRevenue(revenueResp.totalRevenue ?? 0);
        setTotalInvoices(revenueResp.totalInvoices ?? 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDataError(err.message || 'Could not load dashboard data');
      try {
        const roomsResp = await apiCall('/rooms/status/realtime');
        if (roomsResp) {
          setTotalRooms(roomsResp.totalRooms ?? 0);
          const occupied = (roomsResp.statsByStatus || []).find(s => s._id === 'occupied');
          setOccupiedRooms(occupied ? occupied.count : 0);
        }
      } catch (_) { /* ignore */ }
      try {
        const revenueResp = await apiCall('/dashboard/revenue');
        if (revenueResp) {
          setRevenue(revenueResp.totalRevenue ?? 0);
          setTotalInvoices(revenueResp.totalInvoices ?? 0);
        }
      } catch (_) { /* ignore */ }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchDashboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password ? { password: formData.password } : {}),
      };
      if (editingEmployeeId) {
        try {
          await employeeService.updateEmployee(editingEmployeeId, payload);
        } catch (e) {
          await apiCall(`/employees/${editingEmployeeId}`, { method: 'PUT', body: JSON.stringify(payload) });
        }
      } else {
        try {
          await employeeService.createEmployee(payload);
        } catch (e) {
          await apiCall('/employees', { method: 'POST', body: JSON.stringify(payload) });
        }
      }
      closeModal();
      await loadEmployees();
      setEditingEmployeeId(null);
    } catch (err) {
      console.error('Create employee failed', err);
      alert('Could not save employee: ' + (err.message || ''));
    }
  };

  useEffect(() => {
    if (activeTab === 'staff') {
      loadEmployees();
    }
  }, [activeTab]);

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      try {
        await employeeService.deleteEmployee(id);
      } catch (e) {
        await apiCall(`/employees/${id}`, { method: 'DELETE' });
      }
      await loadEmployees();
    } catch (err) {
      console.error(err);
      alert('Could not delete employee');
    }
  };

  return (
    <div className={styles.container}>
      <NavBar title="Management" icon={UserCheck} onLogout={onLogout} />

      <div className={styles.content}>
        <div className={styles.tabNav}>
          {[
            { id: 'dashboard', label: 'Overview', icon: Home },
            { id: 'report', label: 'Reports', icon: FileText },
            { id: 'staff', label: 'Staff', icon: Users },
            { id: 'rooms', label: 'Rooms', icon: Bed },
            { id: 'roomtypes', label: 'Room types', icon: Settings },
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
            <button type="button" className={`${styles.addEmployeeButton} ${styles.mlAuto}`} onClick={openModal}>
              + Add employee
            </button>
          )}
        </div>

        {activeTab === 'dashboard' && (
          <>
            <h2 className={styles.sectionTitle}>System overview</h2>
              <div>
                {dataError && (
                  <div className={styles.dataError}>Data error: {dataError}</div>
                )}
                <div className={`${styles.grid} ${styles.grid4}`}>
                <StatCard
                  title="Total rooms"
                  value={loadingData ? 'Loading...' : (totalRooms != null ? totalRooms : '—')}
                  icon={Bed}
                />

                <StatCard
                  title="Occupied rooms"
                  value={loadingData ? 'Loading...' : (occupiedRooms != null ? occupiedRooms : '—')}
                  icon={Users}
                />

                <StatCard
                  title="Revenue"
                  value={loadingData ? 'Loading...' : (revenue != null ? `₫${Number(revenue).toLocaleString('en-US')}` : '—')}
                  icon={DollarSign}
                />

                <StatCard
                  title="Occupancy rate"
                  value={
                    loadingData
                      ? 'Loading...'
                      : (totalRooms ? `${Math.round(((occupiedRooms || 0) / totalRooms) * 100)}%` : '—')
                  }
                  icon={Calendar}
                />
                </div>
              </div>

            <div className={`${styles.grid} ${styles.gridSingleStack}`}>
              <div className={styles.dashboardPanel}>
                <h3 className={styles.dashboardPanelTitle}>Room status</h3>
                <div className={styles.flexColGapLg}>
                  {loadingData ? (
                    <p className={styles.emptyStaffHint}>Loading...</p>
                  ) : (
                    <div className={styles.miniStatGrid}>
                      <div>
                        <div className={styles.miniStatLabel}>Total rooms</div>
                        <div className={styles.miniStatValue}>{totalRooms || 0}</div>
                      </div>
                      <div>
                        <div className={styles.miniStatLabel}>Occupied</div>
                        <div className={styles.miniStatValueGreen}>{occupiedRooms || 0}</div>
                      </div>
                      <div>
                        <div className={styles.miniStatLabel}>Occupancy rate</div>
                        <div className={styles.miniStatValueGold}>
                          {totalRooms ? `${Math.round(((occupiedRooms || 0) / totalRooms) * 100)}%` : '0%'}
                        </div>
                      </div>
                      <div>
                        <div className={styles.miniStatLabel}>Paid invoices</div>
                        <div className={styles.miniStatValuePurple}>{totalInvoices || 0}</div>
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
            <h2 className={styles.staffPageTitle}>Staff</h2>

            <div className={styles.staffSummaryRow}>
              <div className={styles.staffSummaryCard}>
                <div className={styles.staffSummaryIcon}>
                  <Users size={22} color="#e8c547" />
                </div>
                <div>
                  <div className={styles.staffSummaryValue}>{employees.length}</div>
                  <div className={styles.staffSummaryLabel}>Total staff</div>
                </div>
              </div>

              <div className={styles.staffSummaryCard}>
                <div className={styles.staffSummaryIconAlt}>
                  <UserCheck size={22} color="#f87171" />
                </div>
                <div>
                  <div className={styles.staffSummaryValue}>{employees.filter((e) => e.role === 'manager').length}</div>
                  <div className={styles.staffSummaryLabel}>Managers</div>
                </div>
              </div>

              <div className={styles.staffSummaryCard}>
                <div className={styles.staffSummaryIconInfo}>
                  <UserCheck size={22} color="#93c5fd" />
                </div>
                <div>
                  <div className={styles.staffSummaryValue}>
                    {employees.filter((e) => e.role && e.role !== 'manager').length}
                  </div>
                  <div className={styles.staffSummaryLabel}>Employees</div>
                </div>
              </div>
            </div>

            <div className={styles.mtLg}>
              <div className={styles.staffListBar}>Staff list</div>

              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.staffSearch}
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={styles.staffSelect}
              >
                <option value="all">All roles</option>
                <option value="manager">Manager</option>
                <option value="receptionist">Receptionist</option>
                <option value="housekeeper">Housekeeping</option>
                <option value="maintenance">Maintenance</option>
                <option value="accountant">Accountant</option>
              </select>

              <div className={styles.mtXl}>
                {loadingEmployees ? (
                  <p className={styles.emptyStaffHint}>Loading staff...</p>
                ) : employees.length === 0 ? (
                  <div className={styles.emptyStaffHint}>
                    <p>No employees yet</p>
                    <p>Add your first employee</p>
                  </div>
                ) : (
                  <div className={styles.employeeListGrid}>
                    {(employees || [])
                      .filter((emp) => {
                        if (roleFilter && roleFilter !== 'all' && emp.role !== roleFilter) return false;
                        if (!searchTerm) return true;
                        const q = searchTerm.toLowerCase();
                        const name = (emp.name || '').toLowerCase();
                        const email = (emp.email || '').toLowerCase();
                        return name.includes(q) || email.includes(q);
                      })
                      .map((emp) => (
                        <div key={emp._id} className={styles.employeeRow}>
                          <div>
                            <div className={styles.employeeName}>{emp.name}</div>
                            <div className={styles.employeeMeta}>
                              {emp.email} · {emp.role}
                            </div>
                          </div>
                          <div className={styles.employeeRowActions}>
                            <button
                              type="button"
                              className={styles.btnStaffEdit}
                              onClick={() => {
                                setEditingEmployeeId(emp._id);
                                setFormData({
                                  name: emp.name || '',
                                  email: emp.email || '',
                                  password: '',
                                  role: emp.role || 'receptionist',
                                });
                                setIsModalOpen(true);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={styles.btnStaffDelete}
                              onClick={() => handleDeleteEmployee(emp._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal} role="presentation">
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className={styles.modalHeaderBar}>
                <h3 className={styles.modalTitleText}>
                  {editingEmployeeId ? 'Edit employee' : 'New employee'}
                </h3>
                <button type="button" onClick={closeModal} className={styles.modalCloseBtn} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.modalBodyPad}>
                <div className={styles.modalFormStack}>
                  <div>
                    <label className={styles.formLabel}>
                      Full name <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={styles.formInputDark}
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Email <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={styles.formInputDark}
                      placeholder="e.g. abc@hotel.com"
                    />
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Password{' '}
                      {editingEmployeeId ? (
                        <span className={styles.textMutedHint}>(leave blank to keep current)</span>
                      ) : (
                        <span className={styles.reqStar}>*</span>
                      )}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingEmployeeId}
                      className={styles.formInputDark}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Role <span className={styles.reqStar}>*</span>
                    </label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className={styles.formInputDark}>
                      <option value="manager">Manager</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="housekeeper">Housekeeping</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>
                </div>

                <div className={styles.modalFooterBar}>
                  <button type="button" onClick={closeModal} className={styles.btnModalCancel}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnModalPrimary}>
                    Save employee
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

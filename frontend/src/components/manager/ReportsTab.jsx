import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, Eye } from 'lucide-react';
import { reportService } from '../../services/reportService';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportType, setReportType] = useState('occupancy');
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.listReports();
      setReports(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error loading reports:', err);
      alert('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!dateRange.fromDate || !dateRange.toDate) {
      alert('Vui lòng chọn khoảng thời gian');
      return;
    }

    try {
      setGenerating(true);
      let data;
      if (reportType === 'occupancy') {
        data = await reportService.getOccupancyReport({
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        });
      } else if (reportType === 'revenue') {
        data = await reportService.getRevenueReport({
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        });
      }
      alert('Tạo báo cáo thành công!');
      setShowGenerateModal(false);
      setDateRange({ fromDate: '', toDate: '' });
      loadReports();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể tạo báo cáo'));
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetail = async (reportId) => {
    try {
      const data = await reportService.getReportById(reportId);
      setSelectedReport(data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Không thể tải chi tiết báo cáo');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>Báo cáo</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => setShowGenerateModal(true)}
        >
          <FileText size={18} style={{ marginRight: '0.5rem' }} />
          Tạo báo cáo mới
        </button>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid3}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tổng báo cáo</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{reports.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Báo cáo tỷ lệ lấp đầy</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
            {reports.filter(r => r.reportType === 'occupancy').length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Báo cáo doanh thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
            {reports.filter(r => r.reportType === 'revenue').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Mã báo cáo</th>
              <th className={tableStyles.th}>Tên báo cáo</th>
              <th className={tableStyles.th}>Loại</th>
              <th className={tableStyles.th}>Từ ngày</th>
              <th className={tableStyles.th}>Đến ngày</th>
              <th className={tableStyles.th}>Ngày tạo</th>
              <th className={tableStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={7}>Đang tải...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={7}>Không có báo cáo nào</td></tr>
            ) : (
              reports.map(report => (
                <tr key={report._id}>
                  <td className={tableStyles.td}>#{report.reportId || report._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>{report.reportName || 'N/A'}</td>
                  <td className={tableStyles.td}>
                    <span className={`${badgeStyles.badge} ${
                      report.reportType === 'revenue' ? badgeStyles.success : badgeStyles.info
                    }`}>
                      {report.reportType === 'occupancy' ? 'Tỷ lệ lấp đầy' : 
                       report.reportType === 'revenue' ? 'Doanh thu' : report.reportType}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    {report.startDate ? new Date(report.startDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    {report.endDate ? new Date(report.endDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    {report.generatedDate ? new Date(report.generatedDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleViewDetail(report._id)}
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGenerateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Tạo báo cáo mới</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Loại báo cáo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="occupancy">Báo cáo tỷ lệ lấp đầy</option>
                  <option value="revenue">Báo cáo doanh thu</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Từ ngày <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
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
                  Đến ngày <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
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
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowGenerateModal(false);
                  setDateRange({ fromDate: '', toDate: '' });
                }}
                disabled={generating}
              >
                Hủy
              </button>
              <button
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleGenerateReport}
                disabled={generating}
              >
                {generating ? 'Đang tạo...' : 'Tạo báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Chi tiết báo cáo: {selectedReport.reportName}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>Loại báo cáo:</strong> {selectedReport.reportType}
              </div>
              <div>
                <strong>Khoảng thời gian:</strong> {selectedReport.startDate ? new Date(selectedReport.startDate).toLocaleDateString('vi-VN') : '—'} - {selectedReport.endDate ? new Date(selectedReport.endDate).toLocaleDateString('vi-VN') : '—'}
              </div>
              <div>
                <strong>Ngày tạo:</strong> {selectedReport.generatedDate ? new Date(selectedReport.generatedDate).toLocaleDateString('vi-VN') : '—'}
              </div>
              <div>
                <strong>Dữ liệu:</strong>
                <pre style={{
                  background: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginTop: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {JSON.stringify(selectedReport.data, null, 2)}
                </pre>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setShowDetailModal(false)}
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

export default ReportsTab;


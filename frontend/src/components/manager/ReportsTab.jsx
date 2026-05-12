import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Eye } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { asArray } from '../../utils/apiNormalize';
import styles from '../../styles/Dashboard.module.css';
import tableStyles from '../../styles/Table.module.css';
import badgeStyles from '../../styles/Badge.module.css';
import buttonStyles from '../../styles/Button.module.css';

const normalizeReportList = (data) => asArray(data, 'reports');

const reportTypeLabel = (type) => {
  if (type === 'occupancy') return 'Occupancy';
  if (type === 'revenue') return 'Revenue';
  if (type === 'maintenance') return 'Maintenance';
  if (type === 'guest') return 'Guest';
  return type || '—';
};

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
      setReports(normalizeReportList(data));
    } catch (err) {
      console.error('Error loading reports:', err);
      alert('Could not load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!dateRange.fromDate || !dateRange.toDate) {
      alert('Please select a date range');
      return;
    }
    if (dateRange.toDate < dateRange.fromDate) {
      alert('End date must be on or after the start date.');
      return;
    }

    try {
      setGenerating(true);
      if (reportType === 'occupancy') {
        await reportService.saveOccupancyReport({
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        });
      } else if (reportType === 'revenue') {
        await reportService.saveRevenueReport({
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        });
      }
      alert('Report created successfully!');
      setShowGenerateModal(false);
      setDateRange({ fromDate: '', toDate: '' });
      await loadReports();
    } catch (err) {
      alert('Error: ' + (err.message || 'Could not create report'));
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
      alert('Could not load report details');
    }
  };

  const detailSummary = useMemo(() => {
    if (!showDetailModal || !selectedReport?.data) return null;
    const d = selectedReport.data;
    if (selectedReport.reportType === 'occupancy') {
      return (
        <ul className={styles.listMuted}>
          <li>Total rooms: <strong>{d.totalRooms ?? '—'}</strong></li>
          <li>Rooms with overlapping bookings in range: <strong>{d.distinctRoomsWithOverlap ?? '—'}</strong></li>
          <li>Estimated occupancy rate: <strong>{d.occupancyRate != null ? `${d.occupancyRate}%` : '—'}</strong></li>
          <li>Overlapping bookings in range: <strong>{d.bookingsOverlapping ?? '—'}</strong></li>
        </ul>
      );
    }
    if (selectedReport.reportType === 'revenue') {
      const total = d.totalRevenue;
      return (
        <ul className={styles.listMuted}>
          <li>Total revenue (paid invoices in period): <strong>{total != null ? `₫${Number(total).toLocaleString('en-US')}` : '—'}</strong></li>
          <li>Daily rows: <strong>{Array.isArray(d.dailyBreakdown) ? d.dailyBreakdown.length : 0}</strong></li>
        </ul>
      );
    }
    return null;
  }, [showDetailModal, selectedReport]);

  return (
    <div>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Reports</h2>
        <button
          className={`${buttonStyles.primary} ${buttonStyles.md}`}
          onClick={() => setShowGenerateModal(true)}
        >
          <FileText size={18} aria-hidden />
          New report
        </button>
      </div>

      {/* Stats */}
      <div className={`${styles.grid} ${styles.grid3} ${styles.mbLg}`}>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Total reports</div>
          <div className={styles.statTileValue}>{reports.length}</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Occupancy reports</div>
          <div className={styles.statTileValueAccent}>
            {reports.filter((r) => r.reportType === 'occupancy').length}
          </div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Revenue reports</div>
          <div className={styles.statTileValueGreen}>
            {reports.filter((r) => r.reportType === 'revenue').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.th}>Report ID</th>
              <th className={tableStyles.th}>Report name</th>
              <th className={tableStyles.th}>Type</th>
              <th className={tableStyles.th}>From</th>
              <th className={tableStyles.th}>To</th>
              <th className={tableStyles.th}>Created</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={tableStyles.td} colSpan={7}>Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td className={tableStyles.td} colSpan={7}>No reports yet</td></tr>
            ) : (
              reports.map(report => (
                <tr key={report._id}>
                  <td className={tableStyles.td}>#{report.reportId || report._id?.slice(-6)}</td>
                  <td className={tableStyles.td}>{report.reportName || 'N/A'}</td>
                  <td className={tableStyles.td}>
                    <span className={`${badgeStyles.badge} ${
                      report.reportType === 'revenue' ? badgeStyles.success : badgeStyles.info
                    }`}>
                      {reportTypeLabel(report.reportType)}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    {report.startDate ? new Date(report.startDate).toLocaleDateString('en-US') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    {report.endDate ? new Date(report.endDate).toLocaleDateString('en-US') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    {report.generatedDate ? new Date(report.generatedDate).toLocaleDateString('en-US') : '—'}
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => handleViewDetail(report._id)}
                      title="View details"
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

      {/* Generate modal — portaled so date picker and overlay avoid layout issues */}
      {showGenerateModal && createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowGenerateModal(false)} role="presentation">
          <div className={`${styles.modal} ${styles.modalMax500}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="report-generate-title">
            <h2 id="report-generate-title" className={styles.modalFormTitle}>New report</h2>
            <div className={styles.modalFormStack}>
              <div>
                <label className={styles.formLabel} htmlFor="report-type">
                  Report type <span className={styles.reqStar}>*</span>
                </label>
                <select
                  id="report-type"
                  className={styles.formInputDark}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="occupancy">Occupancy report</option>
                  <option value="revenue">Revenue report</option>
                </select>
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="report-from">
                  From <span className={styles.reqStar}>*</span>
                </label>
                <input
                  id="report-from"
                  type="date"
                  className={styles.formInputDark}
                  required
                  value={dateRange.fromDate}
                  max={dateRange.toDate || undefined}
                  onChange={(e) => {
                    const fromDate = e.target.value;
                    setDateRange((prev) => ({
                      fromDate,
                      toDate: prev.toDate && prev.toDate < fromDate ? fromDate : prev.toDate,
                    }));
                  }}
                />
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="report-to">
                  To <span className={styles.reqStar}>*</span>
                </label>
                <input
                  id="report-to"
                  type="date"
                  className={styles.formInputDark}
                  required
                  min={dateRange.fromDate || undefined}
                  value={dateRange.toDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, toDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                type="button"
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => {
                  setShowGenerateModal(false);
                  setDateRange({ fromDate: '', toDate: '' });
                }}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${buttonStyles.primary} ${buttonStyles.md}`}
                onClick={handleGenerateReport}
                disabled={generating}
              >
                {generating ? 'Creating...' : 'Create report'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)} role="presentation">
          <div className={`${styles.modal} ${styles.modalMax700} ${styles.modalScrollable}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className={styles.modalFormTitle}>Report: {selectedReport.reportName}</h2>
            <div className={styles.modalFormStack}>
              <div>
                <strong>Report type:</strong> {reportTypeLabel(selectedReport.reportType)}
              </div>
              <div>
                <strong>Period:</strong>{' '}
                {selectedReport.startDate ? new Date(selectedReport.startDate).toLocaleDateString('en-US') : '—'} —{' '}
                {selectedReport.endDate ? new Date(selectedReport.endDate).toLocaleDateString('en-US') : '—'}
              </div>
              <div>
                <strong>Created:</strong>{' '}
                {selectedReport.generatedDate ? new Date(selectedReport.generatedDate).toLocaleDateString('en-US') : '—'}
              </div>
              {selectedReport.generatedBy && (
                <div>
                  <strong>Created by:</strong>{' '}
                  {typeof selectedReport.generatedBy === 'object'
                    ? selectedReport.generatedBy.name || selectedReport.generatedBy.email || '—'
                    : '—'}
                </div>
              )}
              {detailSummary && (
                <div>
                  <strong>Summary</strong>
                  {detailSummary}
                </div>
              )}
              <div>
                <strong>Full data (JSON)</strong>
                <pre className={`${styles.preCode} ${styles.mtMd}`}>
                  {JSON.stringify(selectedReport.data ?? {}, null, 2)}
                </pre>
              </div>
            </div>
            <div className={styles.modalFooterBar}>
              <button
                type="button"
                className={`${buttonStyles.secondary} ${buttonStyles.md}`}
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportsTab;

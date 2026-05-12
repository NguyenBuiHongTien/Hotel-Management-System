import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText, User, Bed, DollarSign } from 'lucide-react';
import invoiceService from '../../services/invoiceService';
import styles from '../../styles/Dashboard.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';

const paymentMethodLabel = (method) => {
  if (method === 'cash') return 'Cash';
  if (method === 'card') return 'Card';
  if (method === 'bank_transfer') return 'Bank transfer';
  if (method === 'online') return 'Online';
  return method || '';
};

const InvoiceDetailModal = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const data = await invoiceService.getInvoiceById(invoiceId);
        setInvoice(data);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(err.message || 'Could not load invoice details');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const invoiceContent = generateInvoiceHTML();
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const invoiceContent = generateInvoiceHTML();
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice?.invoiceId || invoice?._id?.slice(-6) || 'INV'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateInvoiceHTML = () => {
    if (!invoice) return '';

    const guest = invoice.booking?.guest || {};
    const room = invoice.booking?.room || {};
    const roomType = room?.roomType || {};
    const checkInDate = invoice.booking?.checkInDate ? new Date(invoice.booking.checkInDate) : null;
    const checkOutDate = invoice.booking?.checkOutDate ? new Date(invoice.booking.checkOutDate) : null;
    const nights = checkInDate && checkOutDate
      ? Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
      : 0;

    const gold = '#b8860b';
    const goldDark = '#8b6914';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceId || invoice._id?.slice(-6)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 40px;
      background: #f0f0f2;
      color: #1a1a1a;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 40px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08);
      border: 1px solid #e8e8ec;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid ${gold};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: ${goldDark};
      font-size: 26px;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }
    .header p {
      color: #555;
      font-size: 14px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .info-section {
      flex: 1;
      min-width: 220px;
    }
    .info-section h3 {
      color: #1a1a1a;
      font-size: 15px;
      margin-bottom: 10px;
      border-bottom: 1px solid ${gold};
      padding-bottom: 6px;
    }
    .info-row {
      margin: 8px 0;
      font-size: 14px;
      color: #333;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      display: inline-block;
      width: 120px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: linear-gradient(180deg, #faf8f3 0%, #f3efe6 100%);
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: ${goldDark};
      border-bottom: 2px solid ${gold};
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e5e9;
      color: #333;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .total-section {
      margin-top: 30px;
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      margin: 10px 0;
      font-size: 16px;
    }
    .total-label {
      font-weight: 600;
      color: #666;
      width: 150px;
      text-align: right;
      margin-right: 20px;
    }
    .total-value {
      font-weight: 700;
      color: #1a1a1a;
      width: 150px;
      text-align: right;
    }
    .grand-total {
      font-size: 20px;
      color: ${goldDark};
      border-top: 2px solid ${gold};
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e9;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-paid {
      background: #ecfdf5;
      color: #065f46;
    }
    .status-pending {
      background: #fffbeb;
      color: #92400e;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>PAYMENT INVOICE</h1>
      <p>ABC Hotel — Property management system</p>
    </div>

    <div class="invoice-info">
      <div class="info-section">
        <h3>Invoice details</h3>
        <div class="info-row">
          <span class="info-label">Invoice #:</span>
          <strong>${invoice.invoiceId || invoice._id?.slice(-6)}</strong>
        </div>
        <div class="info-row">
          <span class="info-label">Issue date:</span>
          ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US') : 'N/A'}
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge ${invoice.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
            ${invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}
          </span>
        </div>
        ${invoice.paymentMethod ? `
        <div class="info-row">
          <span class="info-label">Method:</span>
          ${paymentMethodLabel(invoice.paymentMethod)}
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3>Guest details</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          ${guest.fullName || 'N/A'}
        </div>
        ${guest.phoneNumber ? `
        <div class="info-row">
          <span class="info-label">Phone:</span>
          ${guest.phoneNumber}
        </div>
        ` : ''}
        ${guest.email ? `
        <div class="info-row">
          <span class="info-label">Email:</span>
          ${guest.email}
        </div>
        ` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Nights</th>
          <th style="text-align: right;">Unit price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Room ${room.roomNumber || 'N/A'}</strong><br>
            <small style="color: #666;">
              ${roomType.typeName || 'N/A'} |
              Check-in: ${checkInDate ? checkInDate.toLocaleDateString('en-US') : 'N/A'} |
              Check-out: ${checkOutDate ? checkOutDate.toLocaleDateString('en-US') : 'N/A'}
            </small>
          </td>
          <td style="text-align: center;">${nights}</td>
          <td style="text-align: right;">₫${nights > 0 ? (invoice.totalAmount / nights).toLocaleString('en-US') : '0'}</td>
          <td style="text-align: right;"><strong>₫${Number(invoice.totalAmount || 0).toLocaleString('en-US')}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">₫${Number(invoice.totalAmount || 0).toLocaleString('en-US')}</span>
      </div>
      <div class="total-row grand-total">
        <span class="total-label">TOTAL:</span>
        <span class="total-value">₫${Number(invoice.totalAmount || 0).toLocaleString('en-US')}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for staying with us!</p>
      <p>This invoice was generated automatically by the hotel system.</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const modalShellClass = `${styles.modal} ${styles.modalExtraWide} ${styles.modalScrollable}`;

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={modalShellClass} onClick={e => e.stopPropagation()}>
          <div className={styles.modalCenterBody}>
            <div className={styles.modalStateText}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={modalShellClass} onClick={e => e.stopPropagation()}>
          <div className={styles.modalCenterBody}>
            <div className={styles.modalErrorText}>{error}</div>
            <button type="button" className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const guest = invoice.booking?.guest || {};
  const room = invoice.booking?.room || {};
  const roomType = room?.roomType || {};
  const checkInDate = invoice.booking?.checkInDate ? new Date(invoice.booking.checkInDate) : null;
  const checkOutDate = invoice.booking?.checkOutDate ? new Date(invoice.booking.checkOutDate) : null;
  const nights = checkInDate && checkOutDate
    ? Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={modalShellClass} onClick={e => e.stopPropagation()}>
        <div className={styles.invoiceModalHeader}>
          <h2 className={styles.invoiceTitleRow}>
            <FileText size={24} aria-hidden />
            Invoice details
          </h2>
          <div className={styles.invoiceToolbar}>
            <button
              type="button"
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={handlePrint}
              title="Print invoice"
            >
              <Printer size={16} aria-hidden />
              Print
            </button>
            <button
              type="button"
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={handleDownload}
              title="Download"
            >
              <Download size={16} aria-hidden />
              Download
            </button>
            <button
              type="button"
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm} ${styles.btnIconGhost}`}
              onClick={onClose}
              title="Close"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.invoiceGrid2}>
          <div className={styles.invoicePanel}>
            <h3 className={styles.invoicePanelTitle}>
              <FileText size={16} aria-hidden />
              Invoice
            </h3>
            <div className={styles.invoiceKvList}>
              <div className={styles.invoiceKvRow}>
                <span className={styles.invoiceKvLabel}>Invoice #:</span>
                <strong className={styles.invoiceKvStrong}>#{invoice.invoiceId || invoice._id?.slice(-6)}</strong>
              </div>
              <div className={styles.invoiceKvRow}>
                <span className={styles.invoiceKvLabel}>Issue date:</span>
                <span className={styles.invoiceKvValue}>
                  {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US') : 'N/A'}
                </span>
              </div>
              <div className={styles.invoiceKvRow}>
                <span className={styles.invoiceKvLabel}>Status:</span>
                <span className={`${badgeStyles.badge} ${invoice.paymentStatus === 'paid' ? badgeStyles.success : badgeStyles.warning} ${styles.badgeSpacer}`}>
                  {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}
                </span>
              </div>
              {invoice.paymentMethod && (
                <div className={styles.invoiceKvRow}>
                  <span className={styles.invoiceKvLabel}>Method:</span>
                  <span className={styles.invoiceKvValue}>{paymentMethodLabel(invoice.paymentMethod)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.invoicePanel}>
            <h3 className={styles.invoicePanelTitle}>
              <User size={16} aria-hidden />
              Guest
            </h3>
            <div className={styles.invoiceKvList}>
              <div className={styles.invoiceKvRow}>
                <span className={styles.invoiceKvLabel}>Name:</span>
                <strong className={styles.invoiceKvStrong}>{guest.fullName || 'N/A'}</strong>
              </div>
              {guest.phoneNumber && (
                <div className={styles.invoiceKvRow}>
                  <span className={styles.invoiceKvLabel}>Phone:</span>
                  <span className={styles.invoiceKvValue}>{guest.phoneNumber}</span>
                </div>
              )}
              {guest.email && (
                <div className={styles.invoiceKvRow}>
                  <span className={styles.invoiceKvLabel}>Email:</span>
                  <span className={styles.invoiceKvValue}>{guest.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.invoicePanel} ${styles.mbLg}`}>
          <h3 className={styles.invoicePanelTitle}>
            <Bed size={16} aria-hidden />
            Booking
          </h3>
          <div className={styles.invoiceBookingGrid}>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Room:</span>
              <strong className={styles.invoiceKvStrong}>{room.roomNumber || 'N/A'}</strong>
            </div>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Room type:</span>
              <span className={styles.invoiceKvValue}>{roomType.typeName || 'N/A'}</span>
            </div>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Check-in:</span>
              <span className={styles.invoiceKvValue}>
                {checkInDate ? checkInDate.toLocaleDateString('en-US') : 'N/A'}
              </span>
            </div>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Check-out:</span>
              <span className={styles.invoiceKvValue}>
                {checkOutDate ? checkOutDate.toLocaleDateString('en-US') : 'N/A'}
              </span>
            </div>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Nights:</span>
              <span className={styles.invoiceKvValue}>{nights} {nights === 1 ? 'night' : 'nights'}</span>
            </div>
            <div className={styles.invoiceKvRow}>
              <span className={styles.invoiceKvLabel}>Guests:</span>
              <span className={styles.invoiceKvValue}>{invoice.booking?.numberOfGuests || 1}</span>
            </div>
          </div>
        </div>

        <div className={styles.invoiceTableShell}>
          <h3 className={styles.invoicePanelTitle}>
            <DollarSign size={16} aria-hidden />
            Line items
          </h3>
          <table className={styles.invoiceDataTable}>
            <thead>
              <tr>
                <th className={styles.invTh}>Description</th>
                <th className={`${styles.invTh} ${styles.invThCenter}`}>Nights</th>
                <th className={`${styles.invTh} ${styles.invThRight}`}>Unit price</th>
                <th className={`${styles.invTh} ${styles.invThRight}`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.invTd}>
                  <strong>Room {room.roomNumber || 'N/A'}</strong>
                </td>
                <td className={`${styles.invTd} ${styles.invTdCenter}`}>{nights}</td>
                <td className={`${styles.invTd} ${styles.invTdRight}`}>
                  ₫{nights > 0 ? (invoice.totalAmount / nights).toLocaleString('en-US') : '0'}
                </td>
                <td className={`${styles.invTd} ${styles.invTdRight} ${styles.invTdStrong}`}>
                  ₫{Number(invoice.totalAmount || 0).toLocaleString('en-US')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className={styles.invTfootRow}>
                <td colSpan={3} className={styles.invTfootLabel}>
                  TOTAL:
                </td>
                <td className={styles.invTfootTotal}>
                  ₫{Number(invoice.totalAmount || 0).toLocaleString('en-US')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.modalFooterBar}>
          <button
            type="button"
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={handlePrint}
          >
            <Printer size={16} aria-hidden />
            Print invoice
          </button>
          <button
            type="button"
            className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
            onClick={handleDownload}
          >
            <Download size={16} aria-hidden />
            Download
          </button>
          <button
            type="button"
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

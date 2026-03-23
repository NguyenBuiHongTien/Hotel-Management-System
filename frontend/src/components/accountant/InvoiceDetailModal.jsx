import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText, User, Calendar, Bed, DollarSign, CreditCard } from 'lucide-react';
import invoiceService from '../../services/invoiceService';
import styles from '../../styles/Dashboard.module.css';
import buttonStyles from '../../styles/Button.module.css';
import badgeStyles from '../../styles/Badge.module.css';

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
        setError(err.message || 'Không thể tải chi tiết hóa đơn');
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
    link.download = `HoaDon_${invoice?.invoiceId || invoice?._id?.slice(-6) || 'INV'}.html`;
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

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hóa đơn ${invoice.invoiceId || invoice._id?.slice(-6)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      color: #1f2937;
      font-size: 16px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-row {
      margin: 8px 0;
      font-size: 14px;
      color: #374151;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      display: inline-block;
      width: 120px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
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
      color: #6b7280;
      width: 150px;
      text-align: right;
      margin-right: 20px;
    }
    .total-value {
      font-weight: 700;
      color: #1f2937;
      width: 150px;
      text-align: right;
    }
    .grand-total {
      font-size: 20px;
      color: #2563eb;
      border-top: 2px solid #2563eb;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
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
      background: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>HÓA ĐƠN THANH TOÁN</h1>
      <p>Khách sạn ABC - Hệ thống quản lý khách sạn</p>
    </div>

    <div class="invoice-info">
      <div class="info-section">
        <h3>Thông tin hóa đơn</h3>
        <div class="info-row">
          <span class="info-label">Mã HĐ:</span>
          <strong>${invoice.invoiceId || invoice._id?.slice(-6)}</strong>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày lập:</span>
          ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('vi-VN') : 'N/A'}
        </div>
        <div class="info-row">
          <span class="info-label">Trạng thái:</span>
          <span class="status-badge ${invoice.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
            ${invoice.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
          </span>
        </div>
        ${invoice.paymentMethod ? `
        <div class="info-row">
          <span class="info-label">Phương thức:</span>
          ${invoice.paymentMethod === 'cash' ? 'Tiền mặt' :
            invoice.paymentMethod === 'card' ? 'Thẻ' :
            invoice.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
            invoice.paymentMethod === 'online' ? 'Online' : invoice.paymentMethod}
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3>Thông tin khách hàng</h3>
        <div class="info-row">
          <span class="info-label">Họ tên:</span>
          ${guest.fullName || 'N/A'}
        </div>
        ${guest.phoneNumber ? `
        <div class="info-row">
          <span class="info-label">SĐT:</span>
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
          <th>Mô tả</th>
          <th style="text-align: center;">Số đêm</th>
          <th style="text-align: right;">Đơn giá</th>
          <th style="text-align: right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Phòng ${room.roomNumber || 'N/A'}</strong><br>
            <small style="color: #6b7280;">
              ${roomType.typeName || 'N/A'} | 
              Check-in: ${checkInDate ? checkInDate.toLocaleDateString('vi-VN') : 'N/A'} | 
              Check-out: ${checkOutDate ? checkOutDate.toLocaleDateString('vi-VN') : 'N/A'}
            </small>
          </td>
          <td style="text-align: center;">${nights}</td>
          <td style="text-align: right;">₫${nights > 0 ? (invoice.totalAmount / nights).toLocaleString() : '0'}</td>
          <td style="text-align: right;"><strong>₫${Number(invoice.totalAmount || 0).toLocaleString()}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Tổng tiền:</span>
        <span class="total-value">₫${Number(invoice.totalAmount || 0).toLocaleString()}</span>
      </div>
      <div class="total-row grand-total">
        <span class="total-label">TỔNG CỘNG:</span>
        <span class="total-value">₫${Number(invoice.totalAmount || 0).toLocaleString()}</span>
      </div>
    </div>

    <div class="footer">
      <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
      <p>Hóa đơn được tạo tự động bởi hệ thống quản lý khách sạn</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Đang tải...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>
            <button className={buttonStyles.secondary} onClick={onClose}>Đóng</button>
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
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} />
            Chi tiết hóa đơn
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={handlePrint}
              title="In hóa đơn"
            >
              <Printer size={16} style={{ marginRight: '0.25rem' }} />
              In
            </button>
            <button
              className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.sm}`}
              onClick={handleDownload}
              title="Tải xuống"
            >
              <Download size={16} style={{ marginRight: '0.25rem' }} />
              Tải xuống
            </button>
            <button
              className={buttonStyles.secondary}
              onClick={onClose}
              style={{ padding: '0.5rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              Thông tin hóa đơn
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Mã HĐ:</span>
                <strong style={{ marginLeft: '0.5rem', color: '#1f2937' }}>#{invoice.invoiceId || invoice._id?.slice(-6)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày lập:</span>
                <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>
                  {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Trạng thái:</span>
                <span className={`${badgeStyles.badge} ${invoice.paymentStatus === 'paid' ? badgeStyles.success : badgeStyles.warning}`} style={{ marginLeft: '0.5rem' }}>
                  {invoice.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </span>
              </div>
              {invoice.paymentMethod && (
                <div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Phương thức:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>
                    {invoice.paymentMethod === 'cash' ? 'Tiền mặt' :
                     invoice.paymentMethod === 'card' ? 'Thẻ' :
                     invoice.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                     invoice.paymentMethod === 'online' ? 'Online' : invoice.paymentMethod}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              Thông tin khách hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Họ tên:</span>
                <strong style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{guest.fullName || 'N/A'}</strong>
              </div>
              {guest.phoneNumber && (
                <div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>SĐT:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{guest.phoneNumber}</span>
                </div>
              )}
              {guest.email && (
                <div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{guest.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bed size={16} />
            Thông tin đặt phòng
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Phòng:</span>
              <strong style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{room.roomNumber || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loại phòng:</span>
              <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{roomType.typeName || 'N/A'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Check-in:</span>
              <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>
                {checkInDate ? checkInDate.toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Check-out:</span>
              <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>
                {checkOutDate ? checkOutDate.toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Số đêm:</span>
              <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{nights} đêm</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Số khách:</span>
              <span style={{ marginLeft: '0.5rem', color: '#1f2937' }}>{invoice.booking?.numberOfGuests || 1} người</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} />
            Chi tiết thanh toán
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Mô tả</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Số đêm</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Đơn giá</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem', color: '#1f2937' }}>
                  <strong>Phòng {room.roomNumber || 'N/A'}</strong>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#1f2937' }}>{nights}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1f2937' }}>
                  ₫{nights > 0 ? (invoice.totalAmount / nights).toLocaleString() : '0'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>
                  ₫{Number(invoice.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #2563eb' }}>
                <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                  TỔNG CỘNG:
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                  ₫{Number(invoice.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={handlePrint}
          >
            <Printer size={16} style={{ marginRight: '0.5rem' }} />
            In hóa đơn
          </button>
          <button
            className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.md}`}
            onClick={handleDownload}
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            Tải xuống
          </button>
          <button
            className={`${buttonStyles.base} ${buttonStyles.secondary} ${buttonStyles.md}`}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;


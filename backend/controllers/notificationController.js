// Các hàm nội bộ gửi email qua Gmail API (OAuth2 + refresh token)
const { google } = require('googleapis');
const { escapeHtml } = require('../utils/escapeHtml');

const fmtDate = (d) =>
  new Date(d).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

const fmtCurrency = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const paymentMethodLabel = (method) => {
  const map = {
    cash: 'Tiền mặt',
    card: 'Thẻ',
    bank_transfer: 'Chuyển khoản',
    online: 'Thanh toán online',
  };
  return map[method] || method || 'Chưa xác định';
};

const renderEmailLayout = ({ title, subtitle, intro, rows, note }) => {
  const rowHtml = rows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('');

  return `
  <div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#4f46e5;color:#ffffff;padding:18px 20px;">
        <div style="font-size:18px;font-weight:700;">${escapeHtml(title)}</div>
        ${subtitle ? `<div style="margin-top:4px;font-size:13px;opacity:.95;">${escapeHtml(subtitle)}</div>` : ''}
      </div>
      <div style="padding:18px 20px;">
        <p style="margin:0 0 14px;color:#111827;font-size:14px;line-height:1.6;">${intro}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${rowHtml}
        </table>
        ${note ? `<p style="margin:16px 0 0;color:#374151;font-size:13px;line-height:1.6;">${note}</p>` : ''}
      </div>
    </div>
  </div>
  `;
};

/** Encode RFC 2047 Subject cho tiếng Việt */
function encodeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

function buildRawMessage({ from, to, subject, text, html }) {
  let headers = [];
  let body;
  if (html) {
    const boundary = `b_${Date.now()}`;
    headers = [
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text || '',
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
      '',
      `--${boundary}--`,
    ].join('\r\n');
  } else {
    headers = [
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    ];
    body = text || '';
  }

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    ...headers,
    '',
    body,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

async function getGmailClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET hoặc GMAIL_REFRESH_TOKEN'
    );
  }

  // Trùng redirect URI với script getEmailRefreshToken.js (quan trọng khi refresh access token)
  const redirectPort = Number(process.env.GMAIL_OAUTH_PORT) || 3000;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${redirectPort}/oauth2callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * @param {object} opts
 * @param {string} [opts.logContext] — ghi log khi lỗi (vd: bookingId=..., invoiceId=...)
 */
const sendEmail = async ({ to, subject, text, html, logContext }) => {
  const prefix = logContext ? `[email ${logContext}] ` : '';

  const from = process.env.GMAIL_SENDER_EMAIL;
  if (!from) {
    console.warn(`${prefix}Thiếu GMAIL_SENDER_EMAIL trong .env — bỏ qua gửi mail`);
    return { ok: false, skipped: true, reason: 'missing_sender_email' };
  }

  if (!isValidEmail(to)) {
    console.warn(`${prefix}Email người nhận không hợp lệ: ${to || '(empty)'}`);
    return { ok: false, skipped: true, reason: 'invalid_recipient_email' };
  }

  try {
    const gmail = await getGmailClient();
    const raw = buildRawMessage({ from, to, subject, text, html });
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return { ok: true };
  } catch (err) {
    const errorMessage = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error(`${prefix}Gmail API:`, errorMessage);
    return { ok: false, skipped: false, reason: 'gmail_api_error', error: errorMessage };
  }
};


exports.sendCheckInEmail = async (booking) => {
  if (!booking) {
    console.warn('[email] sendCheckInEmail: booking là null/undefined, bỏ qua');
    return { sent: false, reason: 'missing_booking' };
  }

  await booking.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);
  const guest = booking.guest;
  if (!guest || !guest.email) {
    return { sent: false, reason: 'missing_guest_email' };
  }

  const roomLabel =
    booking.room && booking.room.roomNumber != null
      ? `Phòng ${booking.room.roomNumber}`
      : '';
  const subject = roomLabel
    ? `Check-in thành công — ${roomLabel}`
    : 'Check-in thành công';
  const atRoom = roomLabel ? ` tại ${roomLabel}` : '';
  const text = [
    `Chào ${guest.fullName},`,
    '',
    `Bạn đã check-in thành công${atRoom}.`,
    `Check-in dự kiến: ${fmtDate(booking.checkInDate)}`,
    `Check-out dự kiến: ${fmtDate(booking.checkOutDate)}`,
  ].join('\n');
  const html = renderEmailLayout({
    title: 'Check-in thành công',
    subtitle: roomLabel || 'Thông tin lưu trú',
    intro: `Chào <strong>${escapeHtml(guest.fullName)}</strong>, bạn đã check-in thành công${roomLabel ? ` tại <strong>${escapeHtml(roomLabel)}</strong>` : ''}.`,
    rows: [
      { label: 'Check-in dự kiến', value: fmtDate(booking.checkInDate) },
      { label: 'Check-out dự kiến', value: fmtDate(booking.checkOutDate) },
      { label: 'Mã booking', value: String(booking._id) },
    ],
    note: 'Chúc bạn có một kỳ nghỉ thật thoải mái.',
  });

  const logContext = `bookingId=${booking._id}`;
  const result = await sendEmail({
    to: guest.email,
    subject,
    text,
    html,
    logContext,
  });
  if (!result.ok) {
    console.error(`[email] Gửi check-in thất bại, ${logContext}`);
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

/**
 * @desc    Gửi email xác nhận đặt phòng
 */
exports.sendBookingConfirmation = async (booking) => {
  if (!booking) {
    console.warn('[email] sendBookingConfirmation: booking là null/undefined, bỏ qua');
    return { sent: false, reason: 'missing_booking' };
  }

  await booking.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);

  const guest = booking.guest;
  if (!guest || !guest.email) {
    return { sent: false, reason: 'missing_guest_email' };
  }

  const roomLabel =
    booking.room && booking.room.roomNumber != null
      ? `Phòng ${booking.room.roomNumber}`
      : '';
  const rt = booking.room && booking.room.roomType;
  const typeName =
    rt && (rt.typeName || rt.name) ? String(rt.typeName || rt.name) : '';

  const subject = roomLabel
    ? `Xác nhận đặt phòng — ${roomLabel}`
    : 'Xác nhận đặt phòng';
  const text = [
    `Chào ${guest.fullName},`,
    '',
    `Đặt phòng của bạn đã được xác nhận.`,
    `- ${roomLabel || '(phòng đang cập nhật)'}${typeName ? ` (${typeName})` : ''}`,
    `- Check-in dự kiến: ${fmtDate(booking.checkInDate)}`,
    `- Check-out dự kiến: ${fmtDate(booking.checkOutDate)}`,
    `- Số khách: ${booking.numberOfGuests}`,
    `- Tổng tiền: ${Number(booking.totalPrice).toLocaleString('vi-VN')} đ`,
    `- Mã booking: ${booking._id}`,
    '',
    'Cảm ơn bạn đã chọn dịch vụ của chúng tôi.',
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Xác nhận đặt phòng',
    subtitle: roomLabel || 'Đặt phòng thành công',
    intro: `Chào <strong>${escapeHtml(guest.fullName)}</strong>, đặt phòng của bạn đã được xác nhận.`,
    rows: [
      { label: 'Phòng', value: `${roomLabel || 'Phòng (đang cập nhật)'}${typeName ? ` — ${typeName}` : ''}` },
      { label: 'Check-in dự kiến', value: fmtDate(booking.checkInDate) },
      { label: 'Check-out dự kiến', value: fmtDate(booking.checkOutDate) },
      { label: 'Số khách', value: String(booking.numberOfGuests) },
      { label: 'Tổng tiền', value: fmtCurrency(booking.totalPrice) },
      { label: 'Mã booking', value: String(booking._id) },
    ],
    note: 'Cảm ơn bạn đã chọn dịch vụ của chúng tôi.',
  });

  const logContext = `bookingId=${booking._id}`;
  const result = await sendEmail({
    to: guest.email,
    subject,
    text,
    html,
    logContext,
  });
  if (!result.ok) {
    console.error(`[email] Gửi xác nhận đặt phòng thất bại, ${logContext}`);
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

const sendInvoiceMailWithType = async ({ invoice, mailType }) => {
  if (!invoice) {
    console.warn('[email] sendInvoiceMailWithType: invoice là null/undefined, bỏ qua');
    return { sent: false, reason: 'missing_invoice' };
  }

  await invoice.populate({
    path: 'booking',
    populate: [
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
    ],
  });

  const b = invoice.booking;
  if (!b || !b.guest || !b.guest.email) {
    return { sent: false, reason: 'missing_guest_email' };
  }

  const guest = b.guest;
  const roomLabel =
    b.room && b.room.roomNumber != null ? `Phòng ${b.room.roomNumber}` : '';
  const isPaymentSuccess = mailType === 'payment_success';

  const subject = isPaymentSuccess
    ? `Thanh toán thành công #${invoice.invoiceId}`
    : `Xác nhận check-out #${invoice.invoiceId}`;
  const text = [
    `Chào ${guest.fullName},`,
    '',
    isPaymentSuccess ? 'Thanh toán của bạn đã thành công.' : 'Bạn đã check-out thành công, hóa đơn đã được tạo.',
    `Mã hóa đơn: ${invoice.invoiceId}`,
    `- Tổng tiền: ${Number(invoice.totalAmount).toLocaleString('vi-VN')} đ`,
    `- Trạng thái thanh toán: ${isPaymentSuccess ? 'paid' : invoice.paymentStatus}`,
    isPaymentSuccess ? `- Phương thức thanh toán: ${paymentMethodLabel(invoice.paymentMethod)}` : '',
    `- Ngày lập: ${fmtDate(invoice.issueDate)}`,
    roomLabel ? `- ${roomLabel}` : '',
    b.checkInDate ? `- Check-in: ${fmtDate(b.checkInDate)}` : '',
    b.checkOutDate ? `- Check-out: ${fmtDate(b.checkOutDate)}` : '',
    '',
    'Cảm ơn bạn đã lưu trú tại khách sạn.',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    ${renderEmailLayout({
      title: isPaymentSuccess ? 'Thanh toán thành công' : 'Xác nhận check-out',
      subtitle: `Hóa đơn ${String(invoice.invoiceId)}`,
      intro: `Chào <strong>${escapeHtml(guest.fullName)}</strong>, ${
        isPaymentSuccess ? 'chúng tôi đã nhận được thanh toán của bạn.' : 'quá trình check-out đã hoàn tất và hóa đơn đã được tạo.'
      }`,
      rows: [
        { label: 'Mã hóa đơn', value: String(invoice.invoiceId) },
        { label: 'Tổng tiền', value: fmtCurrency(invoice.totalAmount) },
        { label: 'Trạng thái', value: isPaymentSuccess ? 'Đã thanh toán' : String(invoice.paymentStatus) },
        ...(isPaymentSuccess ? [{ label: 'Phương thức', value: paymentMethodLabel(invoice.paymentMethod) }] : []),
        { label: 'Ngày lập', value: fmtDate(invoice.issueDate) },
        ...(roomLabel ? [{ label: 'Phòng', value: roomLabel }] : []),
        ...(b.checkInDate ? [{ label: 'Check-in', value: fmtDate(b.checkInDate) }] : []),
        ...(b.checkOutDate ? [{ label: 'Check-out', value: fmtDate(b.checkOutDate) }] : []),
      ],
      note: 'Cảm ơn bạn đã lưu trú tại khách sạn.',
    })}
  `;

  const logContext = `invoiceId=${invoice.invoiceId} bookingId=${b._id}`;
  const result = await sendEmail({
    to: guest.email,
    subject,
    text,
    html,
    logContext,
  });
  if (!result.ok) {
    console.error(`[email] Gửi email hóa đơn thất bại, ${logContext}`);
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

exports.sendCheckoutInvoiceEmail = async (invoice) =>
  sendInvoiceMailWithType({ invoice, mailType: 'checkout' });

exports.sendPaymentSuccessEmail = async (invoice) =>
  sendInvoiceMailWithType({ invoice, mailType: 'payment_success' });

exports.sendCheckInReminderEmail = async (booking) => {
  if (!booking) {
    return { sent: false, reason: 'missing_booking' };
  }

  await booking.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);

  const guest = booking.guest;
  if (!guest || !guest.email) {
    return { sent: false, reason: 'missing_guest_email' };
  }

  const roomLabel =
    booking.room && booking.room.roomNumber != null
      ? `Phòng ${booking.room.roomNumber}`
      : 'Phòng (đang cập nhật)';
  const roomType = booking.room?.roomType?.typeName || booking.room?.roomType?.name || '';

  const subject = `Nhắc lịch check-in — ${roomLabel}`;
  const text = [
    `Chào ${guest.fullName},`,
    '',
    'Đây là email nhắc lịch check-in sắp tới của bạn.',
    `- Phòng: ${roomLabel}${roomType ? ` (${roomType})` : ''}`,
    `- Check-in dự kiến: ${fmtDate(booking.checkInDate)}`,
    `- Check-out dự kiến: ${fmtDate(booking.checkOutDate)}`,
    `- Mã booking: ${booking._id}`,
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Nhắc lịch check-in',
    subtitle: roomLabel,
    intro: `Chào <strong>${escapeHtml(guest.fullName)}</strong>, lịch check-in của bạn sắp diễn ra.`,
    rows: [
      { label: 'Phòng', value: `${roomLabel}${roomType ? ` — ${roomType}` : ''}` },
      { label: 'Check-in dự kiến', value: fmtDate(booking.checkInDate) },
      { label: 'Check-out dự kiến', value: fmtDate(booking.checkOutDate) },
      { label: 'Mã booking', value: String(booking._id) },
    ],
    note: 'Nếu bạn cần thay đổi thời gian, vui lòng liên hệ lễ tân sớm để được hỗ trợ.',
  });

  const logContext = `bookingId=${booking._id}`;
  const result = await sendEmail({ to: guest.email, subject, text, html, logContext });
  if (!result.ok) {
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

exports.sendCheckOutReminderEmail = async (booking) => {
  if (!booking) {
    return { sent: false, reason: 'missing_booking' };
  }

  await booking.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);

  const guest = booking.guest;
  if (!guest || !guest.email) {
    return { sent: false, reason: 'missing_guest_email' };
  }

  const roomLabel =
    booking.room && booking.room.roomNumber != null
      ? `Phòng ${booking.room.roomNumber}`
      : 'Phòng (đang cập nhật)';

  const subject = `Nhắc lịch check-out — ${roomLabel}`;
  const text = [
    `Chào ${guest.fullName},`,
    '',
    'Đây là email nhắc lịch check-out sắp tới của bạn.',
    `- Phòng: ${roomLabel}`,
    `- Check-out dự kiến: ${fmtDate(booking.checkOutDate)}`,
    `- Mã booking: ${booking._id}`,
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Nhắc lịch check-out',
    subtitle: roomLabel,
    intro: `Chào <strong>${escapeHtml(guest.fullName)}</strong>, thời gian check-out của bạn sắp đến.`,
    rows: [
      { label: 'Phòng', value: roomLabel },
      { label: 'Check-out dự kiến', value: fmtDate(booking.checkOutDate) },
      { label: 'Mã booking', value: String(booking._id) },
    ],
    note: 'Vui lòng liên hệ lễ tân nếu bạn cần hỗ trợ gia hạn thêm thời gian lưu trú.',
  });

  const logContext = `bookingId=${booking._id}`;
  const result = await sendEmail({ to: guest.email, subject, text, html, logContext });
  if (!result.ok) {
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

// Internal helpers to send email via Gmail API (OAuth2 + refresh token)
const { google } = require('googleapis');
const { escapeHtml } = require('../utils/escapeHtml');

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

const fmtCurrency = (value) =>
  `${Number(value || 0).toLocaleString('en-US')} VND`;

const paymentMethodLabel = (method) => {
  const map = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank transfer',
    online: 'Online payment',
  };
  return map[method] || method || 'Not specified';
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

/** Encode RFC 2047 Subject for UTF-8 */
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
      'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN'
    );
  }

  // Must match redirect URI used in getEmailRefreshToken.js when refreshing access token
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
 * @param {string} [opts.logContext] — log context on error (e.g. bookingId=..., invoiceId=...)
 */
const sendEmail = async ({ to, subject, text, html, logContext }) => {
  const prefix = logContext ? `[email ${logContext}] ` : '';

  if (!isValidEmail(to)) {
    console.warn(`${prefix}Invalid recipient email: ${to || '(empty)'}`);
    return { ok: false, skipped: true, reason: 'invalid_recipient_email' };
  }

  let gmail;
  try {
    gmail = await getGmailClient();
  } catch (err) {
    console.warn(`${prefix}${err.message} — skipping email send`);
    return { ok: false, skipped: true, reason: 'missing_oauth_config' };
  }

  let from = String(process.env.GMAIL_SENDER_EMAIL || '').trim();
  if (!from) {
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      from = String(profile.data.emailAddress || '').trim();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.warn(`${prefix}Could not resolve sender from Gmail profile: ${msg}`);
      return { ok: false, skipped: true, reason: 'missing_sender_email' };
    }
  }

  if (!from || !isValidEmail(from)) {
    console.warn(
      `${prefix}Missing valid sender — set GMAIL_SENDER_EMAIL in .env or check OAuth`
    );
    return { ok: false, skipped: true, reason: 'missing_sender_email' };
  }

  try {
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
    console.warn('[email] sendCheckInEmail: booking is null/undefined, skipping');
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
      ? `Room ${booking.room.roomNumber}`
      : '';
  const subject = roomLabel
    ? `Check-in successful — ${roomLabel}`
    : 'Check-in successful';
  const atRoom = roomLabel ? ` at ${roomLabel}` : '';
  const text = [
    `Hello ${guest.fullName},`,
    '',
    `You have successfully checked in${atRoom}.`,
    `Scheduled check-in: ${fmtDate(booking.checkInDate)}`,
    `Scheduled check-out: ${fmtDate(booking.checkOutDate)}`,
  ].join('\n');
  const html = renderEmailLayout({
    title: 'Check-in successful',
    subtitle: roomLabel || 'Stay details',
    intro: `Hello <strong>${escapeHtml(guest.fullName)}</strong>, you have successfully checked in${roomLabel ? ` at <strong>${escapeHtml(roomLabel)}</strong>` : ''}.`,
    rows: [
      { label: 'Scheduled check-in', value: fmtDate(booking.checkInDate) },
      { label: 'Scheduled check-out', value: fmtDate(booking.checkOutDate) },
      { label: 'Booking ID', value: String(booking._id) },
    ],
    note: 'We hope you enjoy your stay.',
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
    console.error(`[email] Check-in email send failed, ${logContext}`);
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

/**
 * @desc    Send booking confirmation email
 */
exports.sendBookingConfirmation = async (booking) => {
  if (!booking) {
    console.warn('[email] sendBookingConfirmation: booking is null/undefined, skipping');
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
      ? `Room ${booking.room.roomNumber}`
      : '';
  const rt = booking.room && booking.room.roomType;
  const typeName =
    rt && (rt.typeName || rt.name) ? String(rt.typeName || rt.name) : '';

  const subject = roomLabel
    ? `Booking confirmation — ${roomLabel}`
    : 'Booking confirmation';
  const text = [
    `Hello ${guest.fullName},`,
    '',
    `Your booking has been confirmed.`,
    `- ${roomLabel || '(room TBD)'}${typeName ? ` (${typeName})` : ''}`,
    `- Scheduled check-in: ${fmtDate(booking.checkInDate)}`,
    `- Scheduled check-out: ${fmtDate(booking.checkOutDate)}`,
    `- Guests: ${booking.numberOfGuests}`,
    `- Total: ${Number(booking.totalPrice).toLocaleString('en-US')} VND`,
    `- Booking ID: ${booking._id}`,
    '',
    'Thank you for choosing us.',
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Booking confirmation',
    subtitle: roomLabel || 'Booking confirmed',
    intro: `Hello <strong>${escapeHtml(guest.fullName)}</strong>, your booking has been confirmed.`,
    rows: [
      { label: 'Room', value: `${roomLabel || 'Room (TBD)'}${typeName ? ` — ${typeName}` : ''}` },
      { label: 'Scheduled check-in', value: fmtDate(booking.checkInDate) },
      { label: 'Scheduled check-out', value: fmtDate(booking.checkOutDate) },
      { label: 'Guests', value: String(booking.numberOfGuests) },
      { label: 'Total', value: fmtCurrency(booking.totalPrice) },
      { label: 'Booking ID', value: String(booking._id) },
    ],
    note: 'Thank you for choosing us.',
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
    console.error(`[email] Booking confirmation send failed, ${logContext}`);
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

const sendInvoiceMailWithType = async ({ invoice, mailType }) => {
  if (!invoice) {
    console.warn('[email] sendInvoiceMailWithType: invoice is null/undefined, skipping');
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
    b.room && b.room.roomNumber != null ? `Room ${b.room.roomNumber}` : '';
  const isPaymentSuccess = mailType === 'payment_success';

  const subject = isPaymentSuccess
    ? `Payment successful #${invoice.invoiceId}`
    : `Check-out confirmation #${invoice.invoiceId}`;
  const text = [
    `Hello ${guest.fullName},`,
    '',
    isPaymentSuccess ? 'Your payment was successful.' : 'You have successfully checked out; your invoice has been created.',
    `Invoice ID: ${invoice.invoiceId}`,
    `- Total: ${Number(invoice.totalAmount).toLocaleString('en-US')} VND`,
    `- Payment status: ${isPaymentSuccess ? 'paid' : invoice.paymentStatus}`,
    isPaymentSuccess ? `- Payment method: ${paymentMethodLabel(invoice.paymentMethod)}` : '',
    `- Issue date: ${fmtDate(invoice.issueDate)}`,
    roomLabel ? `- ${roomLabel}` : '',
    b.checkInDate ? `- Check-in: ${fmtDate(b.checkInDate)}` : '',
    b.checkOutDate ? `- Check-out: ${fmtDate(b.checkOutDate)}` : '',
    '',
    'Thank you for staying with us.',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    ${renderEmailLayout({
      title: isPaymentSuccess ? 'Payment successful' : 'Check-out confirmation',
      subtitle: `Invoice ${String(invoice.invoiceId)}`,
      intro: `Hello <strong>${escapeHtml(guest.fullName)}</strong>, ${
        isPaymentSuccess ? 'we have received your payment.' : 'check-out is complete and your invoice has been created.'
      }`,
      rows: [
        { label: 'Invoice ID', value: String(invoice.invoiceId) },
        { label: 'Total', value: fmtCurrency(invoice.totalAmount) },
        { label: 'Status', value: isPaymentSuccess ? 'Paid' : String(invoice.paymentStatus) },
        ...(isPaymentSuccess ? [{ label: 'Method', value: paymentMethodLabel(invoice.paymentMethod) }] : []),
        { label: 'Issue date', value: fmtDate(invoice.issueDate) },
        ...(roomLabel ? [{ label: 'Room', value: roomLabel }] : []),
        ...(b.checkInDate ? [{ label: 'Check-in', value: fmtDate(b.checkInDate) }] : []),
        ...(b.checkOutDate ? [{ label: 'Check-out', value: fmtDate(b.checkOutDate) }] : []),
      ],
      note: 'Thank you for staying with us.',
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
    console.error(`[email] Invoice email send failed, ${logContext}`);
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
      ? `Room ${booking.room.roomNumber}`
      : 'Room (TBD)';
  const roomType = booking.room?.roomType?.typeName || booking.room?.roomType?.name || '';

  const subject = `Check-in reminder — ${roomLabel}`;
  const text = [
    `Hello ${guest.fullName},`,
    '',
    'This is a reminder about your upcoming check-in.',
    `- Room: ${roomLabel}${roomType ? ` (${roomType})` : ''}`,
    `- Scheduled check-in: ${fmtDate(booking.checkInDate)}`,
    `- Scheduled check-out: ${fmtDate(booking.checkOutDate)}`,
    `- Booking ID: ${booking._id}`,
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Check-in reminder',
    subtitle: roomLabel,
    intro: `Hello <strong>${escapeHtml(guest.fullName)}</strong>, your check-in is coming up.`,
    rows: [
      { label: 'Room', value: `${roomLabel}${roomType ? ` — ${roomType}` : ''}` },
      { label: 'Scheduled check-in', value: fmtDate(booking.checkInDate) },
      { label: 'Scheduled check-out', value: fmtDate(booking.checkOutDate) },
      { label: 'Booking ID', value: String(booking._id) },
    ],
    note: 'If you need to change your schedule, please contact the front desk as soon as possible.',
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
      ? `Room ${booking.room.roomNumber}`
      : 'Room (TBD)';

  const subject = `Check-out reminder — ${roomLabel}`;
  const text = [
    `Hello ${guest.fullName},`,
    '',
    'This is a reminder about your upcoming check-out.',
    `- Room: ${roomLabel}`,
    `- Scheduled check-out: ${fmtDate(booking.checkOutDate)}`,
    `- Booking ID: ${booking._id}`,
  ].join('\n');

  const html = renderEmailLayout({
    title: 'Check-out reminder',
    subtitle: roomLabel,
    intro: `Hello <strong>${escapeHtml(guest.fullName)}</strong>, your check-out time is approaching.`,
    rows: [
      { label: 'Room', value: roomLabel },
      { label: 'Scheduled check-out', value: fmtDate(booking.checkOutDate) },
      { label: 'Booking ID', value: String(booking._id) },
    ],
    note: 'Please contact the front desk if you need a late check-out or extension.',
  });

  const logContext = `bookingId=${booking._id}`;
  const result = await sendEmail({ to: guest.email, subject, text, html, logContext });
  if (!result.ok) {
    return { sent: false, reason: result.reason, error: result.error };
  }
  return { sent: true };
};

// Đây là các hàm nội bộ, không phải là API controllers
// Chúng sẽ được gọi bởi các services khác.

const sendEmail = async ({ to, subject, text }) => {
    // TODO: Cài đặt logic gửi email (ví dụ: Nodemailer, SendGrid)
    console.log('--- SENDING EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('---------------------');
    // Giả lập thành công
    return true;
};

/**
 * @desc    Gửi email xác nhận đặt phòng
 */
exports.sendBookingConfirmation = async (booking) => {
    // Populate guest để lấy email
    await booking.populate('guest');
    
    const guest = booking.guest;
    if (!guest || !guest.email) return;
    
    await sendEmail({
        to: guest.email,
        subject: `Xác nhận đặt phòng #${booking._id}`,
        text: `Chào ${guest.fullName}, đặt phòng của bạn tại phòng ${booking.room} từ ${booking.checkInDate} đến ${booking.checkOutDate} đã được xác nhận.`
    });
};

/**
 * @desc    Gửi email hóa đơn
 */
exports.sendInvoiceEmail = async (invoice) => {
    // Populate lồng nhau để lấy email
    await invoice.populate({
        path: 'booking',
        populate: { path: 'guest' }
    });
    
    const guest = invoice.booking.guest;
    if (!guest || !guest.email) return;

    await sendEmail({
        to: guest.email,
        subject: `Hóa đơn thanh toán #${invoice.invoiceId}`,
        text: `Cảm ơn bạn đã sử dụng dịch vụ. Tổng hóa đơn của bạn là ${invoice.totalAmount}.`
    });
};

// Thêm các hàm khác (sendCancellationConfirmation, v.v.)
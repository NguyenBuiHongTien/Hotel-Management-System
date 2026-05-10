const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const { startOfDay, endOfDay } = require('../utils/dateRange');
const { sendPaymentSuccessEmail } = require('./notificationController');

/**
 * @desc    Ghi nhận thanh toán
 * @route   POST /api/payments
 * @access  Private (Accountant, Receptionist)
 */
const recordPayment = asyncHandler(async (req, res, next) => {
  // Ưu tiên các trường trong invoiceModel
  const { invoiceId, paymentMethod } = req.body;
  // 'amount' và 'paymentDate' không có trong invoiceModel

  if (!invoiceId || !paymentMethod) {
      res.status(400);
      throw new Error('invoiceId và paymentMethod là bắt buộc');
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, paymentStatus: 'pending' },
    {
      $set: {
        paymentStatus: 'paid',
        paymentMethod,
      },
    },
    { new: true, runValidators: true }
  );

  if (!invoice) {
    const existing = await Invoice.findById(invoiceId).select('_id paymentStatus');
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }
    if (existing.paymentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Không thể thanh toán hóa đơn đã hủy' });
    }
    return res.status(400).json({ message: 'Hóa đơn này đã được thanh toán' });
  }

  let emailResult = { sent: false, reason: 'skipped' };
  try {
    const invoiceForEmail = await Invoice.findById(invoice._id).populate({
      path: 'booking',
      populate: [
        { path: 'guest' },
        { path: 'room', populate: { path: 'roomType' } },
      ],
    });
    if (invoiceForEmail) {
      emailResult = await sendPaymentSuccessEmail(invoiceForEmail);
    } else {
      emailResult = { sent: false, reason: 'invoice_not_found_after_payment' };
    }
  } catch (mailErr) {
    console.error(`[email] Gửi thanh toán thất bại, invoiceId=${invoice._id}:`, mailErr.message);
    emailResult = { sent: false, reason: 'email_send_failed', error: mailErr.message };
  }

  res.status(200).json({
    ...invoice.toObject(),
    email: emailResult,
  });
});

/**
 * @desc    Xem lịch sử giao dịch (Hóa đơn đã thanh toán)
 * @route   GET /api/transactions
 * @access  Private (Accountant, Manager)
 */
const getTransactionHistory = asyncHandler(async (req, res, next) => {
    const { fromDate, toDate, method } = req.query;

    const filter = {
      paymentStatus: 'paid',
    };

    if (method) {
      filter.paymentMethod = method;
    }
    
    if (fromDate || toDate) {
      filter.updatedAt = {};
      if (fromDate) {
        filter.updatedAt.$gte = startOfDay(fromDate);
      }
      if (toDate) {
        filter.updatedAt.$lte = endOfDay(toDate);
      }
    }

    const transactions = await Invoice.find(filter)
      .populate({
        path: 'booking',
        select: 'guest checkInDate checkOutDate',
        populate: { 
          path: 'guest', 
          select: 'fullName phoneNumber email' 
        }
      })
      .sort('-updatedAt')
      .lean();
    
    res.json(transactions);
});

module.exports = {
    recordPayment,
    getTransactionHistory
};
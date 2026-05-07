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

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ message: 'Không tìm thấy hóa đơn'});
  }
  if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Hóa đơn này đã được thanh toán'});
  }
  
  invoice.paymentStatus = 'paid';
  invoice.paymentMethod = paymentMethod;
  // invoice.paymentDate = Date.now(); // Model không có trường này
  
  await invoice.save();

  const invoiceForEmail = await Invoice.findById(invoice._id).populate({
    path: 'booking',
    populate: [
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
    ],
  });
  const emailResult = invoiceForEmail
    ? await sendPaymentSuccessEmail(invoiceForEmail)
    : { sent: false, reason: 'invoice_not_found_after_payment' };

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
    try {
        const { fromDate, toDate, method } = req.query;

        console.log('[GET_TRANSACTIONS] Request received:', { fromDate, toDate, method });
        console.log('[GET_TRANSACTIONS] User:', req.user?.email, 'Role:', req.user?.role);

        const filter = {
            paymentStatus: 'paid' // Chỉ lấy giao dịch đã thanh toán
        };
        
        if (method) {
            filter.paymentMethod = method;
        }
        
        // Fix date filter logic
        if (fromDate || toDate) {
            filter.updatedAt = {};
            if (fromDate) {
                filter.updatedAt.$gte = startOfDay(fromDate);
            }
            if (toDate) {
                filter.updatedAt.$lte = endOfDay(toDate);
            }
        }

        console.log('[GET_TRANSACTIONS] Filter:', JSON.stringify(filter, null, 2));

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
            .lean(); // Use lean() for better performance
        
        console.log(`[GET_TRANSACTIONS] Found ${transactions.length} transactions`);
        
        res.json(transactions);
    } catch (error) {
        console.error('[GET_TRANSACTIONS] Error:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy lịch sử giao dịch',
            error: error.message 
        });
    }
});

module.exports = {
    recordPayment,
    getTransactionHistory
};
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    default: () => `INV_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  },
  totalAmount: { 
    type: Number, 
    required: true, 
    min: 0 
},
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'online'],
    default: 'cash'
  },
  issueDate: { 
    type: Date, 
    default: 
    Date.now 
},
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
        unique: true,
        default: () => `CUST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    },
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    phoneNumber: { 
        type: String, 
        required: true,
        validate: {
          validator: function(v) {
            return /^[0-9]{10,11}$/.test(v);
          },
          message: 'Số điện thoại phải có 10-11 chữ số'
        }
    },
    email: { 
        type: String, 
        lowercase: true, 
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Email không hợp lệ'
        }
    },
    address: { 
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);
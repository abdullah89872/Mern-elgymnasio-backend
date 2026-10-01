const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PKR'
  },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'cash', 'bank_transfer'],
    required: true
  },
  mobileAccount: {
    type: String,
    required: function() {
      return ['easypaisa', 'jazzcash'].includes(this.paymentMethod);
    }
  },
  transactionId: {
    type: String,
    required: function() {
      return ['easypaisa', 'jazzcash'].includes(this.paymentMethod);
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  forMonth: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  receiptNumber: String,
  notes: String
}, {
  timestamps: true
});

paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.paymentId = `PAY${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
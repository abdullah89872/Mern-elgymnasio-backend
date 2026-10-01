const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberId: {
    type: String,
    unique: true,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  membershipPlan: {
    type: String,
    enum: ['basic', 'premium', 'vip'],
    default: 'basic'
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: Date,
  monthlyFee: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'cash'],
    default: 'cash'
  },
  easypaisaNumber: String,
  jazzcashNumber: String,
  healthInfo: {
    weight: Number,
    height: Number,
    medicalConditions: [String],
    allergies: [String],
    fitnessGoals: [String]
  },
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  assignedNutritionist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nutritionist'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  attendanceCount: {
    type: Number,
    default: 0
  },
  lastAttendance: Date,
  totalAttendanceDays: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  lastPaymentDate: Date,
  nextPaymentDate: Date
}, {
  timestamps: true
});

memberSchema.pre('save', function(next) {
  if (!this.memberId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.memberId = `MEM${Date.now().toString().slice(-6)}${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
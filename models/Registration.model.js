const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  cnic: {
    type: String
  },
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  membershipPlan: {
    type: String,
    enum: ['basic', 'advanced', 'premium'],
    default: 'basic'
  },
  fitnessGoals: String,
  medicalHistory: String,
  emergencyContact: {
    name: String,
    phone: String
  },
  address: String,
  city: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Hash password before saving
registrationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
registrationSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Registration', registrationSchema);

const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainerId: {
    type: String,
    unique: true,
    default: null,
    sparse: true
  },
  specialization: {
    type: [String],
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  certification: {
    type: String
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String
  }],
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  maxMembers: {
    type: Number,
    default: 15
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isCertified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  },
  bio: String,
  achievements: [String]
}, {
  timestamps: true
});

trainerSchema.pre('save', function(next) {
  if (!this.trainerId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.trainerId = `TRN${Date.now().toString().slice(-6)}${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Trainer', trainerSchema);
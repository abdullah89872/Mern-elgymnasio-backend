const mongoose = require('mongoose');

const nutritionistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nutritionistId: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  specialization: {
    type: [String],
    required: true
  },
  qualification: {
    type: String,
    default: ''
  },
  certification: {
    type: String
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  consultationFee: {
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
    default: 20
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
  mealPlansCreated: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

nutritionistSchema.pre('save', function(next) {
  if (!this.nutritionistId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.nutritionistId = `NUT${Date.now().toString().slice(-6)}${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Nutritionist', nutritionistSchema);
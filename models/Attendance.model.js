const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkOutTime: Date,
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedMethod: {
    type: String,
    enum: ['manual', 'qr'],
    default: 'manual'
  },
  notes: String,
  session: {
    type: String,
    enum: ['morning', 'evening', 'full-day'],
    default: 'full-day'
  }
}, {
  timestamps: true
});

attendanceSchema.index({ memberId: 1, date: 1 }, { unique: true });

attendanceSchema.methods.calculateDuration = function() {
  if (this.checkOutTime) {
    const duration = this.checkOutTime - this.checkInTime;
    return Math.floor(duration / (1000 * 60));
  }
  return null;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
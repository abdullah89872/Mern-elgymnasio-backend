const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markMultipleAttendance,
  getMembersForAttendance,
  markAllPresent,
  getTodayAttendanceSummary,
  getAttendanceReport,
  getMyAttendance,
  resetTodaysAttendance,
  checkTodayAttendanceStatus
} = require('../controllers/attendance.controller');
const { protect, adminOnly, memberOnly } = require('../middleware/auth.middleware');
const { validateAttendance } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// =================== ADMIN ATTENDANCE ROUTES ===================

// Mark attendance for single member
router.post('/mark', adminOnly, validateAttendance, markAttendance);

// Mark attendance for multiple members
router.post('/mark-multiple', adminOnly, markMultipleAttendance);

// Mark all members as present
router.post('/mark-all-present', adminOnly, markAllPresent);

// Get members list for attendance marking
router.get('/members', adminOnly, getMembersForAttendance);

// Get today's attendance summary
router.get('/today-summary', adminOnly, getTodayAttendanceSummary);

// Check if attendance was already submitted today
router.get('/check-today-status', adminOnly, checkTodayAttendanceStatus);

// Get attendance report for date range
router.get('/report', adminOnly, getAttendanceReport);

// Reset today's attendance (for corrections)
router.delete('/reset-today', adminOnly, resetTodaysAttendance);

// =================== MEMBER ATTENDANCE ROUTES ===================

// Get personal attendance history
router.get('/my-attendance', memberOnly, getMyAttendance);

module.exports = router;
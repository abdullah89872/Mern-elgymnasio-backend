const express = require('express');
const router = express.Router();
const {
  getMemberProfile,
  updateMemberProfile,
  getMemberAttendanceHistory,
  getMemberPaymentHistory,
  getAssignedStaff,
  upgradeMembershipPlan,
  getMemberOverview
} = require('../controllers/member.controller');
const { protect, memberOnly } = require('../middleware/auth.middleware');

// Apply protection to all routes
router.use(protect);
router.use(memberOnly);

// Get member profile
router.get('/profile', getMemberProfile);

// Update member profile
router.put('/profile', updateMemberProfile);

// Get member attendance history
router.get('/attendance', getMemberAttendanceHistory);

// Get member payment history
router.get('/payments', getMemberPaymentHistory);

// Get assigned trainer/nutritionist
router.get('/assigned-staff', getAssignedStaff);

// Upgrade membership plan
router.post('/upgrade-plan', upgradeMembershipPlan);

// Get member overview
router.get('/overview', getMemberOverview);

module.exports = router;
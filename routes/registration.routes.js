const express = require('express');
const router = express.Router();
const {
  getPendingRegistrations,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  getRegistrationStats,
  deleteRegistration
} = require('../controllers/registration.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Admin-only routes
router.use(protect, adminOnly);

// Get pending registrations
router.get('/pending', getPendingRegistrations);

// Get all registrations with filtering
router.get('/', getAllRegistrations);

// Get registration statistics
router.get('/stats', getRegistrationStats);

// Approve registration
router.post('/:registrationId/approve', approveRegistration);

// Reject registration
router.post('/:registrationId/reject', rejectRegistration);

// Delete registration
router.delete('/:registrationId', deleteRegistration);

module.exports = router;

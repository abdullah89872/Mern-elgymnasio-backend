const express = require('express');
const router = express.Router();
const {
  processPayment,
  verifyCashPayment,
  getMemberPayments,
  getMyPayments,
  getAllPayments
} = require('../controllers/payment.controller');
const { protect, adminOnly, memberOnly } = require('../middleware/auth.middleware');

router.use(protect);

// Payment routes
router.post('/process', processPayment);
router.post('/verify-cash', verifyCashPayment);
router.get('/member-payments', memberOnly, getMemberPayments);
router.get('/my-payments', memberOnly, getMyPayments);
router.get('/', adminOnly, getAllPayments);

module.exports = router;
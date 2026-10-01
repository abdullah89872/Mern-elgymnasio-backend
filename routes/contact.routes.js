const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contact.controller');

// @route   POST /api/contact
// @desc    Send contact form message to owner's email
// @access  Public
router.post('/', sendContactMessage);

module.exports = router;

const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/register', register);
router.get('/profile', protect, getProfile);

module.exports = router;
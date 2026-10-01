const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ 
        success: false,
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin only.' 
    });
  }
};

const memberOnly = (req, res, next) => {
  if (req.user && req.user.role === 'member') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Access denied. Members only.' 
    });
  }
};

const trainerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'trainer') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Access denied. Trainers only.' 
    });
  }
};

const nutritionistOnly = (req, res, next) => {
  if (req.user && req.user.role === 'nutritionist') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Access denied. Nutritionists only.' 
    });
  }
};

module.exports = { protect, adminOnly, memberOnly, trainerOnly, nutritionistOnly };
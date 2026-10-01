// Registration validation middleware

const validateRegistration = (req, res, next) => {
  const { fullName, email, password, confirmPassword, phone, cnic } = req.body;

  const errors = [];

  // Full Name validation
  if (!fullName || fullName.trim().length === 0) {
    errors.push('Full name is required');
  } else if (fullName.trim().length < 3) {
    errors.push('Full name must be at least 3 characters');
  } else if (fullName.trim().length > 50) {
    errors.push('Full name cannot exceed 50 characters');
  }

  // Email validation
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address');
    }
  }

  // Phone validation (Pakistani format)
  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^(\+92|0)\d{9,10}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.push('Please provide a valid Pakistani phone number (e.g., +923001234567 or 03001234567)');
    }
  }

  // CNIC validation (optional but if provided must be valid)
  if (cnic && cnic.trim().length > 0) {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic.trim())) {
      errors.push('Please provide a valid CNIC in format: XXXXX-XXXXXXX-X');
    }
  }

  // Password validation
  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Confirm password validation
  if (!confirmPassword || confirmPassword.length === 0) {
    errors.push('Please confirm your password');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address');
    }
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin
};

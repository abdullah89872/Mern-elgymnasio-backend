const validateRegistration = (req, res, next) => {
  const { fullName, email, password, phone } = req.body;
  
  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  next();
};

const validateMemberData = (req, res, next) => {
  const { 
    fullName, email, phone, dateOfBirth, age, gender, 
    membershipPlan, monthlyFee, paymentMethod 
  } = req.body;
  
  const requiredFields = [
    'fullName', 'email', 'phone', 'dateOfBirth', 'age', 'gender',
    'membershipPlan', 'monthlyFee', 'paymentMethod'
  ];
  
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
  
  if (age < 16 || age > 100) {
    return res.status(400).json({
      success: false,
      message: 'Age must be between 16 and 100 years'
    });
  }
  
  if (!['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid gender value'
    });
  }
  
  if (!['easypaisa', 'jazzcash', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method. Use easypaisa, jazzcash, or cash'
    });
  }
  
  if (paymentMethod === 'easypaisa' && !req.body.easypaisaNumber) {
    return res.status(400).json({
      success: false,
      message: 'Easypaisa number is required for easypaisa payments'
    });
  }
  
  if (paymentMethod === 'jazzcash' && !req.body.jazzcashNumber) {
    return res.status(400).json({
      success: false,
      message: 'Jazzcash number is required for jazzcash payments'
    });
  }
  
  next();
};

const validateAttendance = (req, res, next) => {
  const { memberId, status } = req.body;
  
  if (!memberId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Member ID and status are required'
    });
  }
  
  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value. Use present, absent, late, or excused'
    });
  }
  
  next();
};

const validatePayment = (req, res, next) => {
  const { memberId, paymentMethod, amount } = req.body;
  
  if (!memberId || !paymentMethod || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Member ID, payment method, and amount are required'
    });
  }
  
  if (!['easypaisa', 'jazzcash', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method. Use easypaisa, jazzcash, or cash'
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }
  
  if (paymentMethod === 'easypaisa' && !req.body.mobileAccount) {
    return res.status(400).json({
      success: false,
      message: 'Mobile account number is required for easypaisa payments'
    });
  }
  
  if (paymentMethod === 'jazzcash' && !req.body.mobileAccount) {
    return res.status(400).json({
      success: false,
      message: 'Mobile account number is required for jazzcash payments'
    });
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateMemberData,
  validateAttendance,
  validatePayment
};
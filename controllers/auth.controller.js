const User = require('../models/User.model');
const Registration = require('../models/Registration.model');
const Member = require('../models/Member.model');
const generateToken = require('../utils/generateToken');

const HARDCODED_ADMINS = [
  {
    fullName: 'Malik Muhammad Azlan',
    email: 'admin@elgymnasio.com',
    password: 'admin123',
    phone: '+923240145654',
    adminCode: 'ELGYM2024',
    role: 'admin'
  },
  {
    fullName: 'Gym Manager',
    email: 'manager@elgymnasio.com',
    password: 'manager123',
    phone: '+923240000000',
    adminCode: 'GYM123',
    role: 'admin'
  }
];

const login = async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    if (adminCode) {
      const hardcodedAdmin = HARDCODED_ADMINS.find(
        admin => admin.adminCode === adminCode
      );

      if (hardcodedAdmin) {
        let adminUser = await User.findOne({ email: hardcodedAdmin.email });

        if (!adminUser) {
          adminUser = await User.create({
            fullName: hardcodedAdmin.fullName,
            email: hardcodedAdmin.email,
            password: hardcodedAdmin.password,
            phone: hardcodedAdmin.phone,
            role: 'admin',
            adminCode: hardcodedAdmin.adminCode
          });
        }

        const isPasswordMatch = await adminUser.comparePassword(password);
        if (!isPasswordMatch) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid admin credentials' 
          });
        }

        adminUser.lastLogin = new Date();
        await adminUser.save();

        return res.json({
          success: true,
          _id: adminUser._id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: adminUser.role,
          token: generateToken(adminUser._id),
          message: 'Admin login successful'
        });
      } else {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid admin code' 
        });
      }
    }

    // Check Registration collection for user login
    const registration = await Registration.findOne({ email }).select('+password');
    
    if (!registration) {
      console.log('Registration not found for email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('Registration found:', registration.email);
    console.log('Stored password hash exists:', !!registration.password);

    // Compare password
    let isPasswordMatch = false;
    try {
      isPasswordMatch = await registration.comparePassword(password);
      console.log('Password match result:', isPasswordMatch);
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Error during password verification'
      });
    }
    
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update last login time
    registration.lastLogin = new Date();
    await registration.save();

    // Return user data from registration
    res.json({
      success: true,
      _id: registration._id,
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      role: 'member',
      token: generateToken(registration._id),
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, phone, cnic } = req.body;

    // Check if registration already exists
    const existingRegistration = await Registration.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        success: false,
        message: 'User already registered with this email or phone number'
      });
    }

    // Create registration record - just save the data
    const registration = await Registration.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      cnic: cnic ? cnic.trim() : null,
      role: 'member',
      status: 'approved',
      isEmailVerified: true,
      approvedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. You can now login.',
      registration: {
        _id: registration._id,
        fullName: registration.fullName,
        email: registration.email,
        phone: registration.phone
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `This ${field} is already registered`
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during registration'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    let response = { user };
    
    if (user.role === 'member') {
      const memberProfile = await Member.findOne({ userId: user._id })
        .populate('assignedTrainer', 'trainerId specialization')
        .populate('assignedNutritionist', 'nutritionistId specialization');
      
      response.memberProfile = memberProfile;
    }

    res.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching profile' 
    });
  }
};

module.exports = { login, register, getProfile };
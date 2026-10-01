const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer.model');
const Nutritionist = require('../models/Nutritionist.model');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const Registration = require('../models/Registration.model');
const jwt = require('jsonwebtoken');

// Public route to get all trainers (no auth required)
router.get('/trainers', async (req, res) => {
  try {
    const trainers = await Trainer.find({ status: { $ne: 'inactive' } })
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .select('-assignedMembers')
      .lean();

    console.log('Fetched trainers:', trainers.length);
    
    const formattedTrainers = trainers.map(trainer => {
      // Debug log to see what's coming from the database
      console.log('Trainer userId data:', trainer.userId);
      
      return {
        _id: trainer._id,
        trainerId: trainer.trainerId,
        name: trainer.userId?.fullName || 'Trainer',
        email: trainer.userId?.email || '',
        phone: trainer.userId?.phone || '',
        specialization: trainer.specialization || [],
        qualification: trainer.qualification || '',
        certification: trainer.certification || '',
        yearsOfExperience: trainer.yearsOfExperience || 0,
        hourlyRate: trainer.hourlyRate || 0,
        rating: trainer.rating || 4.5,
        totalReviews: trainer.totalRatings || 0,
        bio: trainer.bio || '',
        schedule: trainer.schedule || [],
        status: trainer.status || 'active',
        isCertified: trainer.isCertified || false
      };
    });

    res.json({
      success: true,
      data: {
        trainers: formattedTrainers,
        total: formattedTrainers.length
      }
    });
  } catch (error) {
    console.error('Get public trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trainers'
    });
  }
});

// Public route to get all nutritionists (no auth required)
router.get('/nutritionists', async (req, res) => {
  try {
    const nutritionists = await Nutritionist.find({ status: { $ne: 'inactive' } })
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .select('-assignedMembers')
      .lean();

    console.log('Fetched nutritionists:', nutritionists.length);

    const formattedNutritionists = nutritionists.map(nutritionist => {
      // Debug log to see what's coming from the database
      console.log('Nutritionist userId data:', nutritionist.userId);
      
      return {
        _id: nutritionist._id,
        nutritionistId: nutritionist.nutritionistId,
        name: nutritionist.userId?.fullName || 'Nutritionist',
        email: nutritionist.userId?.email || '',
        phone: nutritionist.userId?.phone || '',
        specialization: nutritionist.specialization || [],
        qualification: nutritionist.qualification || '',
        certification: nutritionist.certification || '',
        yearsOfExperience: nutritionist.yearsOfExperience || 0,
        consultationFee: nutritionist.consultationFee || 0,
        rating: nutritionist.rating || 4.5,
        totalReviews: nutritionist.totalRatings || 0,
        bio: nutritionist.bio || '',
        schedule: nutritionist.schedule || [],
        status: nutritionist.status || 'active',
        isCertified: nutritionist.isCertified || false
      };
    });

    res.json({
      success: true,
      data: {
        nutritionists: formattedNutritionists,
        total: formattedNutritionists.length
      }
    });
  } catch (error) {
    console.error('Get public nutritionists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nutritionists'
    });
  }
});

// Get single trainer details
router.get('/trainers/:id', async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id)
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .select('-assignedMembers')
      .lean();

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: trainer._id,
        trainerId: trainer.trainerId,
        name: trainer.userId?.fullName || 'Trainer',
        email: trainer.userId?.email || '',
        phone: trainer.userId?.phone || '',
        specialization: trainer.specialization || [],
        qualification: trainer.qualification || '',
        certification: trainer.certification || '',
        yearsOfExperience: trainer.yearsOfExperience || 0,
        hourlyRate: trainer.hourlyRate || 0,
        rating: trainer.rating || 4.5,
        totalReviews: trainer.totalRatings || 0,
        bio: trainer.bio || '',
        schedule: trainer.schedule || [],
        status: trainer.status || 'active'
      }
    });
  } catch (error) {
    console.error('Get trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trainer'
    });
  }
});

// Get single nutritionist details
router.get('/nutritionists/:id', async (req, res) => {
  try {
    const nutritionist = await Nutritionist.findById(req.params.id)
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .select('-assignedMembers')
      .lean();

    if (!nutritionist) {
      return res.status(404).json({
        success: false,
        message: 'Nutritionist not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: nutritionist._id,
        nutritionistId: nutritionist.nutritionistId,
        name: nutritionist.userId?.fullName || 'Nutritionist',
        email: nutritionist.userId?.email || '',
        phone: nutritionist.userId?.phone || '',
        specialization: nutritionist.specialization || [],
        qualification: nutritionist.qualification || '',
        certification: nutritionist.certification || '',
        yearsOfExperience: nutritionist.yearsOfExperience || 0,
        consultationFee: nutritionist.consultationFee || 0,
        rating: nutritionist.rating || 4.5,
        totalReviews: nutritionist.totalRatings || 0,
        bio: nutritionist.bio || '',
        schedule: nutritionist.schedule || [],
        status: nutritionist.status || 'active'
      }
    });
  } catch (error) {
    console.error('Get nutritionist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nutritionist'
    });
  }
});

// Check if user is a member and get their profile
router.get('/check-membership', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({
        success: true,
        isMember: false,
        message: 'No token provided'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.json({
        success: true,
        isMember: false,
        message: 'Invalid token'
      });
    }
    
    // Find user in User collection OR Registration collection
    let user = await User.findById(decoded.id).select('-password');
    let registration = null;
    
    if (!user) {
      // Check Registration collection
      registration = await Registration.findById(decoded.id).select('-password');
      
      if (!registration) {
        return res.json({
          success: true,
          isMember: false,
          message: 'User not found'
        });
      }
      
      // Use registration data as user
      user = {
        _id: registration._id,
        fullName: registration.fullName,
        email: registration.email,
        phone: registration.phone
      };
    }
    
    // Check if user is a member (check by userId or by email)
    let member = await Member.findOne({ userId: user._id })
      .populate('userId', 'fullName email phone')
      .populate('assignedTrainer')
      .populate('assignedNutritionist');
    
    // If not found by userId, try to find by matching email in User collection
    if (!member && registration) {
      const linkedUser = await User.findOne({ email: registration.email });
      if (linkedUser) {
        member = await Member.findOne({ userId: linkedUser._id })
          .populate('userId', 'fullName email phone')
          .populate('assignedTrainer')
          .populate('assignedNutritionist');
      }
    }
    
    if (!member) {
      return res.json({
        success: true,
        isMember: false,
        user: {
          fullName: user.fullName,
          email: user.email
        },
        message: 'User is not a member'
      });
    }
    
    // Get attendance records
    const attendanceRecords = await Attendance.find({ memberId: member._id })
      .sort({ date: -1 })
      .limit(30);
    
    // Get attendance stats
    const totalPresent = await Attendance.countDocuments({ 
      memberId: member._id, 
      status: 'present' 
    });
    
    const totalAbsent = await Attendance.countDocuments({ 
      memberId: member._id, 
      status: 'absent' 
    });
    
    // This month attendance
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthPresent = await Attendance.countDocuments({
      memberId: member._id,
      date: { $gte: thisMonth },
      status: 'present'
    });
    
    res.json({
      success: true,
      isMember: true,
      member: {
        _id: member._id,
        memberId: member.memberId,
        name: member.userId?.fullName || 'Member',
        email: member.userId?.email || '',
        phone: member.userId?.phone || '',
        dateOfBirth: member.dateOfBirth,
        age: member.age,
        gender: member.gender,
        address: member.address,
        membershipPlan: member.membershipPlan,
        membershipStartDate: member.membershipStartDate,
        membershipEndDate: member.membershipEndDate,
        monthlyFee: member.monthlyFee,
        paymentMethod: member.paymentMethod,
        status: member.status,
        assignedTrainer: member.assignedTrainer,
        assignedNutritionist: member.assignedNutritionist
      },
      attendance: {
        records: attendanceRecords.map(a => ({
          _id: a._id,
          date: a.date,
          status: a.status,
          checkInTime: a.checkInTime,
          checkOutTime: a.checkOutTime,
          notes: a.notes
        })),
        stats: {
          totalPresent,
          totalAbsent,
          thisMonthPresent,
          attendanceRate: (totalPresent + totalAbsent) > 0 
            ? ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1) 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Check membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking membership'
    });
  }
});

// User self-registration as member (requires login, NOT admin)
router.post('/join-member', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login first to join as a member'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
    
    // Find user in User collection OR Registration collection
    let user = await User.findById(decoded.id);
    let registration = null;
    
    if (!user) {
      // User not in User collection, check Registration collection
      registration = await Registration.findById(decoded.id);
      
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.'
        });
      }
      
      // Create a User from Registration data
      user = await User.create({
        fullName: registration.fullName,
        email: registration.email,
        password: registration.password, // Already hashed
        phone: registration.phone,
        cnic: registration.cnic,
        role: 'member',
        isVerified: true
      });
      
      console.log('Created User from Registration:', user.email);
    }
    
    // Check if already a member (check both user ID and registration ID)
    let existingMember = await Member.findOne({ userId: user._id });
    if (!existingMember && registration) {
      existingMember = await Member.findOne({ registrationId: registration._id });
    }
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member! Go to your profile page.'
      });
    }
    
    const {
      fullName, phone, dateOfBirth, age, gender, address,
      emergencyContact, membershipPlan, monthlyFee, paymentMethod,
      paymentMobileNumber
    } = req.body;
    
    // Validate payment mobile number for easypaisa/jazzcash
    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !paymentMobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required for EasyPaisa/JazzCash payment'
      });
    }
    
    // Update user info if provided
    if (fullName && fullName !== user.fullName) {
      user.fullName = fullName;
    }
    if (phone && phone !== user.phone) {
      user.phone = phone;
    }
    user.role = 'member';
    await user.save();
    
    // Generate unique memberId
    const memberId = `MEM${Date.now().toString().slice(-8)}`;
    
    // Create member record
    const memberData = {
      userId: user._id,
      memberId,
      dateOfBirth: new Date(dateOfBirth),
      age,
      gender,
      address,
      emergencyContact,
      membershipPlan,
      monthlyFee,
      paymentMethod,
      status: 'active',
      paymentStatus: 'pending'
    };
    
    if (paymentMethod === 'easypaisa') {
      memberData.easypaisaNumber = paymentMobileNumber;
    } else if (paymentMethod === 'jazzcash') {
      memberData.jazzcashNumber = paymentMobileNumber;
    }
    
    const member = await Member.create(memberData);
    
    // Create payment record
    const currentMonth = new Date().toISOString().slice(0, 7);
    let transactionId = '';
    let paymentId = `PAY${Date.now().toString().slice(-8)}`;
    
    if (paymentMethod === 'easypaisa') {
      transactionId = `EASY${Date.now().toString().slice(-8)}`;
    } else if (paymentMethod === 'jazzcash') {
      transactionId = `JAZZ${Date.now().toString().slice(-8)}`;
    } else {
      transactionId = `CASH${Date.now().toString().slice(-8)}`;
    }
    
    const payment = await Payment.create({
      memberId: member._id,
      userId: user._id,
      paymentId,
      amount: monthlyFee,
      paymentMethod,
      mobileAccount: paymentMobileNumber || undefined,
      transactionId,
      status: 'completed', // Auto-complete for user self-registration
      forMonth: currentMonth,
      notes: 'Self-registration membership payment'
    });
    
    res.status(201).json({
      success: true,
      message: 'Welcome! You are now a member of EL GYMNASIO!',
      data: {
        member: {
          _id: member._id,
          memberId: member.memberId,
          name: user.fullName,
          email: user.email,
          membershipPlan: member.membershipPlan,
          monthlyFee: member.monthlyFee,
          paymentMethod: member.paymentMethod,
          status: member.status
        },
        payment: {
          paymentId: payment.paymentId,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.status
        }
      }
    });
    
  } catch (error) {
    console.error('Join member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// Public route to view member profile by username (email) and name
// This allows viewing profile without full login - checks Registration collection
router.post('/view-member-profile', async (req, res) => {
  try {
    const { username, name } = req.body;

    if (!username || !name) {
      return res.status(400).json({
        success: false,
        message: 'Username (email) and name are required'
      });
    }

    const emailLower = username.toLowerCase().trim();
    const nameLower = name.toLowerCase().trim();

    // Find in Registration collection (primary check)
    let registration = await Registration.findOne({ email: emailLower });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check your email address.'
      });
    }

    // Verify name matches (case-insensitive)
    const storedName = registration.fullName.toLowerCase().trim();
    
    if (storedName !== nameLower) {
      return res.status(400).json({
        success: false,
        message: 'Name does not match our records. Please enter your full name exactly as registered.'
      });
    }

    // Check if user has a User account and Member record
    let user = await User.findOne({ email: emailLower });
    let member = null;
    let attendanceRecords = [];
    let totalAttendance = 0;
    let presentDays = 0;
    let attendanceRate = 0;

    if (user) {
      member = await Member.findOne({ userId: user._id })
        .populate('assignedTrainer')
        .populate('assignedNutritionist');

      if (member) {
        // Get attendance records
        attendanceRecords = await Attendance.find({ 
          memberId: member._id 
        }).sort({ date: -1 }).limit(30);

        // Calculate attendance stats
        totalAttendance = await Attendance.countDocuments({ memberId: member._id });
        presentDays = await Attendance.countDocuments({ memberId: member._id, status: 'present' });
        attendanceRate = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0;
      }
    }

    // Get all trainers and nutritionists
    const trainers = await Trainer.find({ status: { $ne: 'inactive' } })
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .lean();

    const nutritionists = await Nutritionist.find({ status: { $ne: 'inactive' } })
      .populate({
        path: 'userId',
        select: 'fullName email phone',
        model: 'User'
      })
      .lean();

    // Format trainers
    const formattedTrainers = trainers.map(trainer => ({
      _id: trainer._id,
      name: trainer.userId?.fullName || 'Trainer',
      specialization: trainer.specialization || [],
      qualification: trainer.qualification || '',
      yearsOfExperience: trainer.yearsOfExperience || 0,
      rating: trainer.rating || 4.5,
      totalReviews: trainer.totalRatings || 0
    }));

    // Format nutritionists
    const formattedNutritionists = nutritionists.map(nutritionist => ({
      _id: nutritionist._id,
      name: nutritionist.userId?.fullName || 'Nutritionist',
      specialization: nutritionist.specialization || [],
      qualification: nutritionist.qualification || '',
      yearsOfExperience: nutritionist.yearsOfExperience || 0,
      rating: nutritionist.rating || 4.5,
      totalReviews: nutritionist.totalRatings || 0
    }));

    // Return profile data based on what's available
    res.json({
      success: true,
      member: {
        _id: member?._id || registration._id,
        memberId: member?.memberId || 'Not a member yet',
        name: registration.fullName,
        email: registration.email,
        phone: registration.phone || user?.phone || 'N/A',
        membershipPlan: member?.membershipPlan || 'None',
        membershipStatus: member?.status || 'Not registered',
        monthlyFee: member?.monthlyFee || 0,
        membershipStartDate: member?.membershipStartDate || null,
        paymentMethod: member?.paymentMethod || 'N/A',
        gender: member?.gender || 'N/A',
        age: member?.age || 'N/A',
        address: member?.address || {},
        assignedTrainer: member?.assignedTrainer || null,
        assignedNutritionist: member?.assignedNutritionist || null,
        isMember: !!member
      },
      attendance: {
        records: attendanceRecords,
        stats: {
          totalDays: totalAttendance,
          presentDays,
          absentDays: totalAttendance - presentDays,
          attendanceRate
        }
      },
      trainers: formattedTrainers,
      nutritionists: formattedNutritionists
    });

  } catch (error) {
    console.error('View member profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile'
    });
  }
});

// Public route to add member without auth (for user portal)
router.post('/members/add', async (req, res) => {
  try {
    const {
      fullName, email, phone, cnic, password,
      dateOfBirth, age, gender, address,
      emergencyContact, membershipPlan, monthlyFee, paymentMethod,
      easypaisaNumber, jazzcashNumber, healthInfo
    } = req.body;

    // Check if user already has a member record
    let user = await User.findOne({ email });

    if (user) {
      // Check if this user already has a member record
      const existingMemberRecord = await Member.findOne({ userId: user._id });
      if (existingMemberRecord) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member. Please go to your profile page.'
        });
      }
    } else {
      // Check for phone conflict
      const phoneConflict = await User.findOne({ phone });
      if (phoneConflict) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists. Please use a different phone number.'
        });
      }
      
      // Create new user without CNIC (set to undefined to avoid duplicate null issue)
      user = await User.create({
        fullName,
        email,
        password: password || 'password123',
        phone,
        role: 'member',
        isVerified: true
      });
    }

    // Generate unique memberId
    const memberId = `MEM${Date.now().toString().slice(-8)}`;

    const memberData = {
      userId: user._id,
      memberId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      age: age || 25,
      gender: gender || 'male',
      address: address || {},
      emergencyContact: emergencyContact || {},
      membershipPlan: membershipPlan || 'basic',
      monthlyFee: monthlyFee || 2900,
      paymentMethod: paymentMethod || 'cash',
      healthInfo: healthInfo || {},
      status: 'active',
      paymentStatus: 'pending'
    };

    if (paymentMethod === 'easypaisa' && easypaisaNumber) {
      memberData.easypaisaNumber = easypaisaNumber;
    } else if (paymentMethod === 'jazzcash' && jazzcashNumber) {
      memberData.jazzcashNumber = jazzcashNumber;
    }

    const member = await Member.create(memberData);

    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);

    let transactionId = '';
    let paymentId = '';
    let mobileAccount = '';

    if (paymentMethod === 'easypaisa') {
      transactionId = `EASY${Date.now().toString().slice(-8)}`;
      paymentId = `PAY${Date.now().toString().slice(-8)}`;
      mobileAccount = easypaisaNumber;
    } else if (paymentMethod === 'jazzcash') {
      transactionId = `JAZZ${Date.now().toString().slice(-8)}`;
      paymentId = `PAY${Date.now().toString().slice(-8)}`;
      mobileAccount = jazzcashNumber;
    } else {
      transactionId = `CASH${Date.now().toString().slice(-8)}`;
      paymentId = `PAY${Date.now().toString().slice(-8)}`;
    }

    const payment = await Payment.create({
      memberId: member._id,
      userId: user._id,
      paymentId,
      amount: monthlyFee || 2900,
      paymentMethod: paymentMethod || 'cash',
      mobileAccount: paymentMethod !== 'cash' ? mobileAccount : undefined,
      transactionId,
      status: 'pending',
      forMonth: currentMonth,
      notes: 'Initial membership payment'
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        },
        member: {
          _id: member._id,
          memberId: member.memberId,
          membershipPlan: member.membershipPlan,
          monthlyFee: member.monthlyFee,
          paymentMethod: member.paymentMethod
        },
        payment: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          status: payment.status
        }
      }
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding member'
    });
  }
});

module.exports = router;

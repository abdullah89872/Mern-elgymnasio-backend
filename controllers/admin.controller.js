const Member = require('../models/Member.model');
const User = require('../models/User.model');
const Trainer = require('../models/Trainer.model');
const Nutritionist = require('../models/Nutritionist.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');

const addMember = async (req, res) => {
  try {
    const {
      fullName, email, phone, cnic, password,
      dateOfBirth, age, gender, address,
      emergencyContact, membershipPlan, monthlyFee, paymentMethod,
      easypaisaNumber, jazzcashNumber, healthInfo
    } = req.body;

    // Check if user already has a member record
    const existingMember = await Member.findOne({}).populate('userId').then(async () => {
      const user = await User.findOne({ email });
      if (user) {
        return await Member.findOne({ userId: user._id });
      }
      return null;
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member. Please go to your profile page.'
      });
    }

    // Check if user exists (from registration)
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists from registration, update their role to member if needed
      if (user.role !== 'member' && user.role !== 'admin') {
        user.role = 'member';
        await user.save();
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
      
      // Create new user
      user = await User.create({
        fullName,
        email,
        password: password || 'password123',
        phone,
        ...(cnic && { cnic }),
        role: 'member',
        isVerified: true
      });
    }

    // Check if this user already has a member record
    const existingMemberRecord = await Member.findOne({ userId: user._id });
    if (existingMemberRecord) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member. Please go to your profile page.'
      });
    }

    // Generate unique memberId
    const memberId = `MEM${Date.now().toString().slice(-8)}`;

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
      healthInfo,
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
      amount: monthlyFee,
      paymentMethod,
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
    console.error('Error details:', error.errors);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding member',
      error: error.message
    });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      membershipPlan = ''
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { memberId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (membershipPlan) {
      query.membershipPlan = membershipPlan;
    }

    const skip = (page - 1) * limit;

    const members = await Member.find(query)
      .populate('userId', 'fullName email phone cnic')
      .populate('assignedTrainer', 'trainerId specialization')
      .populate('assignedNutritionist', 'nutritionistId specialization')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Member.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const activeMembers = await Member.countDocuments({ status: 'active' });
    const pendingMembers = await Member.countDocuments({ status: 'pending' });
    const totalRevenue = await Member.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$monthlyFee' } } }
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMembers: total,
          limit: parseInt(limit)
        },
        statistics: {
          activeMembers,
          pendingMembers,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching members'
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('userId', 'fullName email phone cnic')
      .populate('assignedTrainer')
      .populate('assignedNutritionist');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const attendance = await Attendance.find({ memberId: member._id })
      .sort({ date: -1 })
      .limit(30);

    const payments = await Payment.find({ memberId: member._id })
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        member,
        attendance,
        payments
      }
    });

  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching member details'
    });
  }
};

const addTrainer = async (req, res) => {
  try {
    const {
      fullName, email, phone, password,
      specialization, qualification, certification,
      yearsOfExperience, hourlyRate, schedule, bio, isCertified, maxMembers, status
    } = req.body;

    console.log('Adding trainer with data:', { fullName, email, phone, specialization, bio, isCertified, status });

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists. Please use a different email.'
      });
    }

    // Create a new user for the trainer
    const user = await User.create({
      fullName,
      email,
      password: password || 'password123',
      phone,
      role: 'trainer',
      isVerified: true
    });
    console.log('Created new user for trainer:', user._id, user.fullName);

    // Generate trainerId before creating record (fixes validation)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trainerId = `TRN${Date.now().toString().slice(-6)}${randomNum}`;

    const trainer = await Trainer.create({
      userId: user._id,
      trainerId,
      specialization: Array.isArray(specialization) ? specialization : [specialization],
      qualification,
      certification: certification || '',
      yearsOfExperience: yearsOfExperience || 0,
      hourlyRate: hourlyRate || 0,
      schedule: schedule || [],
      bio: bio || '',
      isCertified: isCertified || false,
      maxMembers: maxMembers || 15,
      status: status || 'active'
    });

    console.log('Created trainer record:', trainer._id);

    res.status(201).json({
      success: true,
      message: 'Trainer added successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email
        },
        trainer: {
          _id: trainer._id,
          trainerId: trainer.trainerId,
          specialization: trainer.specialization
        }
      }
    });

  } catch (error) {
    console.error('Add trainer error:', error);
    console.error('Error stack:', error.stack);
    
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
      message: 'Server error adding trainer',
      error: error.message
    });
  }
};

const addNutritionist = async (req, res) => {
  try {
    const {
      fullName, email, phone, password,
      specialization, qualification, certification,
      yearsOfExperience, consultationFee, schedule, bio, isCertified, maxMembers, status
    } = req.body;

    console.log('=== ADD NUTRITIONIST REQUEST ===');
    console.log('Received data:', { fullName, email, phone, specialization, bio, isCertified, status });

    // Validate required fields
    if (!fullName || !email || !phone || !specialization) {
      console.error('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fullName, email, phone, specialization'
      });
    }

    // Check for existing email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        console.log('Email already exists:', email);
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      if (existingUser.phone === phone) {
        console.log('Phone already exists:', phone);
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: password || 'password123',
      phone,
      role: 'nutritionist',
      isVerified: true
    });
    console.log('✓ Created user:', user._id);

    // Generate nutritionistId
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const nutritionistId = `NUT${Date.now().toString().slice(-6)}${randomNum}`;
    console.log('Generated nutritionist ID:', nutritionistId);

    // Ensure specialization is an array
    const spec = Array.isArray(specialization) ? specialization : [specialization];
    console.log('Specialization array:', spec);

    // Create nutritionist record
    const nutritionist = await Nutritionist.create({
      userId: user._id,
      nutritionistId,
      specialization: spec,
      qualification: qualification || '',
      certification: certification || '',
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 0,
      schedule: schedule || [],
      bio: bio || '',
      isCertified: isCertified || false,
      maxMembers: maxMembers || 20,
      status: status || 'active'
    });
    console.log('✓ Created nutritionist record:', nutritionist._id);

    console.log('✓ NUTRITIONIST ADDED SUCCESSFULLY');
    res.status(201).json({
      success: true,
      message: 'Nutritionist added successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email
        },
        nutritionist: {
          _id: nutritionist._id,
          nutritionistId: nutritionist.nutritionistId,
          specialization: nutritionist.specialization
        }
      }
    });
  } catch (error) {
    console.error('=== ADD NUTRITIONIST ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      console.error('Validation errors:', messages);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + messages.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error('Duplicate key error on field:', field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding nutritionist'
    });
  }
};

const getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find()
      .populate('userId', 'fullName email phone')
      .populate('assignedMembers', 'memberId');

    res.json({
      success: true,
      data: {
        trainers,
        total: trainers.length
      }
    });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trainers'
    });
  }
};

const getAllNutritionists = async (req, res) => {
  try {
    const nutritionists = await Nutritionist.find()
      .populate('userId', 'fullName email phone')
      .populate('assignedMembers', 'memberId');

    res.json({
      success: true,
      data: {
        nutritionists,
        total: nutritionists.length
      }
    });
  } catch (error) {
    console.error('Get nutritionists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nutritionists'
    });
  }
};

const assignTrainerToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { trainerId } = req.body;

    const member = await Member.findById(memberId);
    const trainer = await Trainer.findById(trainerId);

    if (!member || !trainer) {
      return res.status(404).json({
        success: false,
        message: 'Member or Trainer not found'
      });
    }

    if (trainer.assignedMembers.length >= trainer.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Trainer has reached maximum capacity'
      });
    }

    member.assignedTrainer = trainerId;
    await member.save();

    if (!trainer.assignedMembers.includes(memberId)) {
      trainer.assignedMembers.push(memberId);
      await trainer.save();
    }

    res.json({
      success: true,
      message: 'Trainer assigned successfully',
      data: {
        member: {
          memberId: member.memberId,
          assignedTrainer: trainer.trainerId
        }
      }
    });

  } catch (error) {
    console.error('Assign trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning trainer'
    });
  }
};

const assignNutritionistToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { nutritionistId } = req.body;

    const member = await Member.findById(memberId);
    const nutritionist = await Nutritionist.findById(nutritionistId);

    if (!member || !nutritionist) {
      return res.status(404).json({
        success: false,
        message: 'Member or Nutritionist not found'
      });
    }

    if (nutritionist.assignedMembers.length >= nutritionist.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Nutritionist has reached maximum capacity'
      });
    }

    member.assignedNutritionist = nutritionistId;
    await member.save();

    if (!nutritionist.assignedMembers.includes(memberId)) {
      nutritionist.assignedMembers.push(memberId);
      await nutritionist.save();
    }

    res.json({
      success: true,
      message: 'Nutritionist assigned successfully',
      data: {
        member: {
          memberId: member.memberId,
          assignedNutritionist: nutritionist.nutritionistId
        }
      }
    });

  } catch (error) {
    console.error('Assign nutritionist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning nutritionist'
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'active' });
    const newMembersThisMonth = await Member.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const totalTrainers = await Trainer.countDocuments();
    const totalNutritionists = await Nutritionist.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          forMonth: currentMonth,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    const totalAttendance = await Attendance.countDocuments();
    const attendanceRate = totalMembers > 0 ? 
      (totalAttendance / (totalMembers * 30) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        members: {
          total: totalMembers,
          active: activeMembers,
          newThisMonth: newMembersThisMonth
        },
        staff: {
          trainers: totalTrainers,
          nutritionists: totalNutritionists
        },
        attendance: {
          today: todaysAttendance,
          rate: attendanceRate
        },
        revenue: {
          monthly: monthlyRevenue[0]?.total || 0,
          pendingPayments
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
};

const deleteTrainer = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    console.log('Deleting trainer:', trainerId, 'with userId:', trainer.userId);

    // Delete the trainer record
    await Trainer.findByIdAndDelete(trainerId);

    // Optionally delete the user as well (or just update role)
    if (trainer.userId) {
      await User.findByIdAndUpdate(
        trainer.userId,
        { role: 'user' },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Trainer deleted successfully'
    });

  } catch (error) {
    console.error('Delete trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting trainer'
    });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    console.log('Deleting member:', memberId, 'with userId:', member.userId);

    // Delete attendance records for this member
    await Attendance.deleteMany({ memberId: memberId });

    // Delete payment records for this member
    await Payment.deleteMany({ memberId: memberId });

    // Delete the member record
    await Member.findByIdAndDelete(memberId);

    // Update user role back to 'user' (don't delete the user account)
    if (member.userId) {
      await User.findByIdAndUpdate(
        member.userId,
        { role: 'user' },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });

  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting member'
    });
  }
};

const deleteNutritionist = async (req, res) => {
  try {
    const { nutritionistId } = req.params;

    const nutritionist = await Nutritionist.findById(nutritionistId);
    if (!nutritionist) {
      return res.status(404).json({
        success: false,
        message: 'Nutritionist not found'
      });
    }

    console.log('Deleting nutritionist:', nutritionistId, 'with userId:', nutritionist.userId);

    // Delete the nutritionist record
    await Nutritionist.findByIdAndDelete(nutritionistId);

    // Optionally delete the user as well (or just update role)
    if (nutritionist.userId) {
      await User.findByIdAndUpdate(
        nutritionist.userId,
        { role: 'user' },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Nutritionist deleted successfully'
    });

  } catch (error) {
    console.error('Delete nutritionist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting nutritionist'
    });
  }
};

module.exports = {
  addMember,
  getAllMembers,
  getMemberById,
  deleteMember,
  addTrainer,
  addNutritionist,
  getAllTrainers,
  getAllNutritionists,
  assignTrainerToMember,
  assignNutritionistToMember,
  getDashboardStats,
  deleteTrainer,
  deleteNutritionist
};
const Member = require('../models/Member.model');
const User = require('../models/User.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');

// @desc    Get member profile by user ID (for logged-in members)
// @route   GET /api/members/profile
const getMemberProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const member = await Member.findOne({ userId })
      .populate('userId', 'fullName email phone cnic')
      .populate('assignedTrainer', 'trainerId specialization')
      .populate('assignedNutritionist', 'nutritionistId specialization');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    // Get attendance summary
    const totalAttendance = await Attendance.countDocuments({ 
      memberId: member._id,
      status: 'present'
    });
    
    // Get this month attendance
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthAttendance = await Attendance.countDocuments({
      memberId: member._id,
      date: { $gte: thisMonth },
      status: 'present'
    });
    
    // Get payment status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentPayment = await Payment.findOne({
      memberId: member._id,
      forMonth: currentMonth,
      status: 'completed'
    });
    
    const attendanceRate = member.totalAttendanceDays > 0 ?
      (totalAttendance / member.totalAttendanceDays * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        member,
        statistics: {
          totalAttendance,
          thisMonthAttendance,
          attendanceRate: parseFloat(attendanceRate),
          paymentStatus: currentPayment ? 'paid' : member.paymentStatus,
          nextPaymentDate: member.nextPaymentDate,
          membershipDays: Math.floor((new Date() - member.membershipStartDate) / (1000 * 60 * 60 * 24))
        }
      }
    });
    
  } catch (error) {
    console.error('Get member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching member profile'
    });
  }
};

// @desc    Update member profile (for logged-in members)
// @route   PUT /api/members/profile
const updateMemberProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
    // Find member
    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    // Fields that members can update
    const allowedUpdates = [
      'address',
      'emergencyContact',
      'healthInfo',
      'easypaisaNumber',
      'jazzcashNumber'
    ];
    
    // Filter update data
    const filteredUpdates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updateData[key];
      }
    });
    
    // Update member
    const updatedMember = await Member.findByIdAndUpdate(
      member._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName email phone');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        member: updatedMember
      }
    });
    
  } catch (error) {
    console.error('Update member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Get member attendance history (for logged-in members)
// @route   GET /api/members/attendance
const getMemberAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 30,
      startDate,
      endDate 
    } = req.query;
    
    // Find member
    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    const query = { memberId: member._id };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    }
    
    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .populate('markedBy', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Attendance.countDocuments(query);
    
    // Calculate statistics
    const totalPresent = await Attendance.countDocuments({ 
      memberId: member._id,
      status: 'present'
    });
    
    const totalAbsent = await Attendance.countDocuments({ 
      memberId: member._id,
      status: 'absent'
    });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthPresent = await Attendance.countDocuments({
      memberId: member._id,
      date: { $gte: thisMonth },
      status: 'present'
    });
    
    const thisMonthAbsent = await Attendance.countDocuments({
      memberId: member._id,
      date: { $gte: thisMonth },
      status: 'absent'
    });
    
    const attendanceRate = member.totalAttendanceDays > 0 ?
      (totalPresent / member.totalAttendanceDays * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        },
        statistics: {
          totalPresent,
          totalAbsent,
          thisMonthPresent,
          thisMonthAbsent,
          attendanceRate: parseFloat(attendanceRate),
          lastAttendance: member.lastAttendance,
          totalAttendanceDays: member.totalAttendanceDays
        }
      }
    });
    
  } catch (error) {
    console.error('Get member attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance history'
    });
  }
};

// @desc    Get member payment history (for logged-in members)
// @route   GET /api/members/payments
const getMemberPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 12,
      status 
    } = req.query;
    
    // Find member
    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    const query = { memberId: member._id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .populate('verifiedBy', 'fullName')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    // Calculate payment statistics
    const totalPaid = await Payment.aggregate([
      { $match: { memberId: member._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const pendingPayments = await Payment.countDocuments({ 
      memberId: member._id, 
      status: 'pending' 
    });
    
    // Get current month payment status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayment = await Payment.findOne({
      memberId: member._id,
      forMonth: currentMonth,
      status: 'completed'
    });
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        },
        statistics: {
          totalPaid: totalPaid[0]?.total || 0,
          pendingPayments,
          currentMonthPaid: !!currentMonthPayment,
          monthlyFee: member.monthlyFee,
          nextPaymentDate: member.nextPaymentDate,
          paymentMethod: member.paymentMethod
        }
      }
    });
    
  } catch (error) {
    console.error('Get member payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payment history'
    });
  }
};

// @desc    Get member assigned trainer/nutritionist details
// @route   GET /api/members/assigned-staff
const getAssignedStaff = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const member = await Member.findOne({ userId })
      .populate('assignedTrainer')
      .populate('assignedNutritionist');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    const staffData = {};
    
    // Get trainer details
    if (member.assignedTrainer) {
      const trainer = member.assignedTrainer;
      const trainerUser = await User.findById(trainer.userId).select('fullName email phone');
      
      staffData.trainer = {
        ...trainer._doc,
        userDetails: trainerUser
      };
    }
    
    // Get nutritionist details
    if (member.assignedNutritionist) {
      const nutritionist = member.assignedNutritionist;
      const nutritionistUser = await User.findById(nutritionist.userId).select('fullName email phone');
      
      staffData.nutritionist = {
        ...nutritionist._doc,
        userDetails: nutritionistUser
      };
    }
    
    res.json({
      success: true,
      data: staffData
    });
    
  } catch (error) {
    console.error('Get assigned staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching assigned staff'
    });
  }
};

// @desc    Upgrade membership plan (for logged-in members)
// @route   POST /api/members/upgrade-plan
const upgradeMembershipPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newPlan, paymentMethod, mobileAccount } = req.body;
    
    // Validate plan
    const validPlans = ['basic', 'premium', 'vip'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid membership plan'
      });
    }
    
    // Find member
    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    // Check if already on this plan
    if (member.membershipPlan === newPlan) {
      return res.status(400).json({
        success: false,
        message: `You are already on the ${newPlan} plan`
      });
    }
    
    // Define plan prices
    const planPrices = {
      'basic': 2900,
      'premium': 4900,
      'vip': 7900
    };
    
    const newMonthlyFee = planPrices[newPlan];
    const upgradeFee = newMonthlyFee - member.monthlyFee;
    
    if (upgradeFee <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot downgrade plan through this endpoint'
      });
    }
    
    // Create upgrade payment record
    const currentMonth = new Date().toISOString().slice(0, 7);
    let transactionId = '';
    
    if (paymentMethod === 'easypaisa') {
      transactionId = `EASYUP${Date.now().toString().slice(-8)}`;
    } else if (paymentMethod === 'jazzcash') {
      transactionId = `JAZZUP${Date.now().toString().slice(-8)}`;
    } else {
      transactionId = `CASHUP${Date.now().toString().slice(-8)}`;
    }
    
    const payment = await Payment.create({
      memberId: member._id,
      userId: member.userId,
      amount: upgradeFee,
      paymentMethod,
      mobileAccount: paymentMethod !== 'cash' ? mobileAccount : undefined,
      transactionId,
      status: paymentMethod === 'cash' ? 'pending' : 'completed',
      forMonth: currentMonth,
      notes: `Upgrade from ${member.membershipPlan} to ${newPlan} plan`
    });
    
    // Update member plan and fee
    member.membershipPlan = newPlan;
    member.monthlyFee = newMonthlyFee;
    
    if (paymentMethod !== 'cash') {
      member.paymentStatus = 'paid';
    }
    
    if (paymentMethod === 'easypaisa' && mobileAccount) {
      member.easypaisaNumber = mobileAccount;
      member.paymentMethod = 'easypaisa';
    } else if (paymentMethod === 'jazzcash' && mobileAccount) {
      member.jazzcashNumber = mobileAccount;
      member.paymentMethod = 'jazzcash';
    }
    
    await member.save();
    
    res.json({
      success: true,
      message: paymentMethod === 'cash' 
        ? 'Upgrade requested. Please pay at reception.' 
        : 'Membership upgraded successfully',
      data: {
        oldPlan: member.membershipPlan,
        newPlan: newPlan,
        upgradeFee: upgradeFee,
        newMonthlyFee: newMonthlyFee,
        payment: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          status: payment.status
        }
      }
    });
    
  } catch (error) {
    console.error('Upgrade membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error upgrading membership'
    });
  }
};

// @desc    Get member statistics and overview
// @route   GET /api/members/overview
const getMemberOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const member = await Member.findOne({ userId })
      .populate('userId', 'fullName email phone')
      .populate('assignedTrainer', 'trainerId specialization')
      .populate('assignedNutritionist', 'nutritionistId specialization');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }
    
    // Get attendance statistics
    const totalAttendance = await Attendance.countDocuments({ 
      memberId: member._id,
      status: 'present'
    });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthAttendance = await Attendance.countDocuments({
      memberId: member._id,
      date: { $gte: thisMonth },
      status: 'present'
    });
    
    // Get last 7 days attendance
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayAttendance = await Attendance.findOne({
        memberId: member._id,
        date: { $gte: date, $lt: nextDay }
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        status: dayAttendance ? dayAttendance.status : 'not_marked'
      });
    }
    
    // Get payment status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentPayment = await Payment.findOne({
      memberId: member._id,
      forMonth: currentMonth,
      status: 'completed'
    });
    
    const attendanceRate = member.totalAttendanceDays > 0 ?
      (totalAttendance / member.totalAttendanceDays * 100).toFixed(1) : 0;
    
    // Calculate membership duration
    const membershipStart = new Date(member.membershipStartDate);
    const today = new Date();
    const membershipDays = Math.floor((today - membershipStart) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      data: {
        memberInfo: {
          name: member.userId.fullName,
          memberId: member.memberId,
          membershipPlan: member.membershipPlan,
          membershipStartDate: member.membershipStartDate,
          membershipDays: membershipDays
        },
        attendance: {
          total: totalAttendance,
          thisMonth: thisMonthAttendance,
          rate: parseFloat(attendanceRate),
          last7Days: last7Days,
          lastAttendance: member.lastAttendance
        },
        payment: {
          status: currentPayment ? 'paid' : member.paymentStatus,
          monthlyFee: member.monthlyFee,
          nextPaymentDate: member.nextPaymentDate,
          paymentMethod: member.paymentMethod
        },
        assignedStaff: {
          trainer: member.assignedTrainer,
          nutritionist: member.assignedNutritionist
        }
      }
    });
    
  } catch (error) {
    console.error('Get member overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching member overview'
    });
  }
};

module.exports = {
  getMemberProfile,
  updateMemberProfile,
  getMemberAttendanceHistory,
  getMemberPaymentHistory,
  getAssignedStaff,
  upgradeMembershipPlan,
  getMemberOverview
};
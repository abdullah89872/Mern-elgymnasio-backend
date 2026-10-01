const Member = require('../models/Member.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const Trainer = require('../models/Trainer.model');
const Nutritionist = require('../models/Nutritionist.model');

const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalMembers = await Member.countDocuments();
    const totalTrainers = await Trainer.countDocuments();
    const totalNutritionists = await Nutritionist.countDocuments();
    
    // Active members
    const activeMembers = await Member.countDocuments({ status: 'active' });
    
    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Today's attendance
    const todaysAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    });
    
    // This month's revenue
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
    
    // Pending payments
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    
    // New members this month
    const newMembersThisMonth = await Member.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    // Attendance rate
    const totalAttendanceDays = await Attendance.countDocuments({ status: 'present' });
    const attendanceRate = totalMembers > 0 ? 
      ((todaysAttendance / activeMembers) * 100).toFixed(1) : 0;
    
    // Recent members
    const recentMembers = await Member.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recent payments
    const recentPayments = await Payment.find()
      .populate({
        path: 'memberId',
        select: 'memberId',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      })
      .sort({ paymentDate: -1 })
      .limit(5);
    
    // Attendance chart data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayAttendance = await Attendance.countDocuments({
        date: { $gte: date, $lt: nextDay },
        status: 'present'
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        attendance: dayAttendance
      });
    }
    
    res.json({
      success: true,
      data: {
        stats: {
          totalMembers,
          activeMembers,
          totalTrainers,
          totalNutritionists,
          todaysAttendance,
          attendanceRate: parseFloat(attendanceRate),
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          pendingPayments,
          newMembersThisMonth
        },
        recentMembers,
        recentPayments,
        attendanceChart: last7Days
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

module.exports = {
  getDashboardStats
};
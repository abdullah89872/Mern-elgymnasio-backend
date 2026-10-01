const Attendance = require('../models/Attendance.model');
const Member = require('../models/Member.model');
const User = require('../models/User.model');

const markAttendance = async (req, res) => {
  try {
    const { memberId, status, notes, session } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Member is ${member.status}. Cannot mark attendance.`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      memberId: member._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      if (existingAttendance.status !== status) {
        existingAttendance.status = status;
        existingAttendance.notes = notes;
        existingAttendance.markedBy = req.user._id;
        await existingAttendance.save();

        if (existingAttendance.status === 'present' && status === 'absent') {
          member.attendanceCount = Math.max(0, member.attendanceCount - 1);
          member.totalAttendanceDays = Math.max(0, member.totalAttendanceDays - 1);
        } else if (existingAttendance.status === 'absent' && status === 'present') {
          member.attendanceCount += 1;
          member.totalAttendanceDays += 1;
          member.lastAttendance = new Date();
        }
        await member.save();
      }

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: {
          memberId: member.memberId,
          memberName: (await User.findById(member.userId)).fullName,
          status: existingAttendance.status,
          date: existingAttendance.date,
          markedBy: req.user.fullName
        }
      });
    }

    const attendance = await Attendance.create({
      memberId: member._id,
      userId: member.userId,
      date: today,
      checkInTime: new Date(),
      status: status || 'absent',
      markedMethod: 'manual',
      markedBy: req.user._id,
      notes: notes,
      session: session || 'full-day'
    });

    if (status === 'present') {
      member.attendanceCount += 1;
      member.lastAttendance = new Date();
      member.totalAttendanceDays += 1;
      await member.save();
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        memberId: member.memberId,
        memberName: (await User.findById(member.userId)).fullName,
        status: attendance.status,
        date: attendance.date,
        markedBy: req.user.fullName,
        notes: attendance.notes
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking attendance'
    });
  }
};

const markMultipleAttendance = async (req, res) => {
  try {
    const { attendanceList, date } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance list'
      });
    }

    // Use provided date or default to today
    let attendanceDate = new Date();
    if (date) {
      attendanceDate = new Date(date);
    }
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (const item of attendanceList) {
      try {
        const member = await Member.findById(item.memberId);
        
        if (!member) {
          errors.push({
            memberId: item.memberId,
            error: 'Member not found'
          });
          continue;
        }

        // Check for existing attendance on that specific date
        const nextDay = new Date(attendanceDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
          memberId: member._id,
          date: { $gte: attendanceDate, $lt: nextDay }
        });

        let attendance;
        let memberUpdated = false;

        if (existingAttendance) {
          // Update existing attendance
          const oldStatus = existingAttendance.status;
          existingAttendance.status = item.status || 'absent';
          existingAttendance.notes = item.notes;
          existingAttendance.markedBy = req.user._id;
          await existingAttendance.save();
          attendance = existingAttendance;
        } else {
          // Create new attendance record
          attendance = await Attendance.create({
            memberId: member._id,
            userId: member.userId,
            date: attendanceDate,
            checkInTime: new Date(),
            status: item.status || 'absent',
            markedMethod: 'manual',
            markedBy: req.user._id,
            notes: item.notes
          });
          memberUpdated = true;
        }

        // Update member statistics only for today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (attendanceDate.getTime() === today.getTime() && item.status === 'present' && memberUpdated) {
          member.attendanceCount += 1;
          member.lastAttendance = new Date();
          member.totalAttendanceDays += 1;
          await member.save();
        }

        results.push({
          memberId: member.memberId,
          memberName: (await User.findById(member.userId)).fullName,
          status: attendance.status,
          attendanceId: attendance._id,
          date: attendanceDate
        });

      } catch (error) {
        errors.push({
          memberId: item.memberId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Attendance marked for ${results.length} members on ${attendanceDate.toLocaleDateString()}`,
      data: {
        successful: results,
        failed: errors,
        date: attendanceDate
      }
    });

  } catch (error) {
    console.error('Multiple attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking multiple attendance'
    });
  }
};

const getMembersForAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const tomorrow = new Date(queryDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const members = await Member.find({ status: 'active' })
      .populate('userId', 'fullName')
      .select('memberId userId attendanceCount lastAttendance membershipPlan')
      .sort({ 'userId.fullName': 1 });

    const todaysAttendance = await Attendance.find({
      date: { $gte: queryDate, $lt: tomorrow }
    }).select('memberId status notes');

    const attendanceMap = {};
    todaysAttendance.forEach(att => {
      attendanceMap[att.memberId.toString()] = {
        status: att.status,
        notes: att.notes
      };
    });

    const membersWithAttendance = members.map(member => {
      const memberAttendance = attendanceMap[member._id.toString()];
      return {
        _id: member._id,
        memberId: member.memberId,
        name: member.userId.fullName,
        attendanceCount: member.attendanceCount,
        lastAttendance: member.lastAttendance,
        membershipPlan: member.membershipPlan,
        todayAttendance: memberAttendance || {
          status: 'not_marked',
          notes: ''
        }
      };
    });

    res.json({
      success: true,
      data: {
        members: membersWithAttendance,
        date: queryDate,
        totalMembers: members.length,
        markedToday: todaysAttendance.length
      }
    });

  } catch (error) {
    console.error('Get members for attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching members for attendance'
    });
  }
};

const markAllPresent = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const members = await Member.find({ status: 'active' });
    
    let markedCount = 0;
    let skippedCount = 0;

    for (const member of members) {
      try {
        const existingAttendance = await Attendance.findOne({
          memberId: member._id,
          date: { $gte: today, $lt: tomorrow }
        });

        if (!existingAttendance) {
          await Attendance.create({
            memberId: member._id,
            userId: member.userId,
            date: today,
            checkInTime: new Date(),
            status: 'present',
            markedMethod: 'manual',
            markedBy: req.user._id
          });

          member.attendanceCount += 1;
          member.lastAttendance = new Date();
          member.totalAttendanceDays += 1;
          await member.save();

          markedCount++;
        } else {
          if (existingAttendance.status !== 'present') {
            existingAttendance.status = 'present';
            existingAttendance.markedBy = req.user._id;
            await existingAttendance.save();

            member.attendanceCount += 1;
            member.lastAttendance = new Date();
            member.totalAttendanceDays += 1;
            await member.save();

            markedCount++;
          } else {
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error marking attendance for member ${member.memberId}:`, error);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: 'Bulk attendance marked successfully',
      data: {
        marked: markedCount,
        skipped: skippedCount,
        total: members.length
      }
    });

  } catch (error) {
    console.error('Mark all present error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking all as present'
    });
  }
};

const getTodayAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
    .populate({
      path: 'memberId',
      select: 'memberId',
      populate: {
        path: 'userId',
        select: 'fullName'
      }
    })
    .populate('markedBy', 'fullName')
    .sort({ 'memberId.userId.fullName': 1 });

    const activeMembers = await Member.countDocuments({ status: 'active' });

    const presentCount = todaysAttendance.filter(a => a.status === 'present').length;
    const absentCount = todaysAttendance.filter(a => a.status === 'absent').length;
    const notMarkedCount = activeMembers - todaysAttendance.length;

    const attendanceRate = activeMembers > 0 ? 
      (presentCount / activeMembers * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          date: today,
          totalMembers: activeMembers,
          present: presentCount,
          absent: absentCount,
          notMarked: notMarkedCount,
          attendanceRate: parseFloat(attendanceRate)
        },
        attendance: todaysAttendance.map(att => ({
          memberId: att.memberId.memberId,
          memberName: att.memberId.userId.fullName,
          status: att.status,
          markedBy: att.markedBy.fullName,
          time: att.checkInTime,
          notes: att.notes
        }))
      }
    });

  } catch (error) {
    console.error('Today summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching today\'s attendance summary'
    });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, memberId } = req.query;

    const query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    }

    if (memberId) {
      const member = await Member.findOne({
        $or: [{ memberId }, { _id: memberId }]
      });
      if (member) {
        query.memberId = member._id;
      }
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'memberId',
        select: 'memberId',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      })
      .populate('markedBy', 'fullName')
      .sort({ date: -1 });

    const dailyStats = {};
    attendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          date: dateStr,
          present: 0,
          absent: 0,
          total: 0
        };
      }
      dailyStats[dateStr][record.status] = (dailyStats[dateStr][record.status] || 0) + 1;
      dailyStats[dateStr].total += 1;
    });

    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    
    const attendanceRate = totalRecords > 0 ? 
      (presentCount / totalRecords * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        attendance,
        dailyStats: dailyStatsArray,
        statistics: {
          totalRecords,
          present: presentCount,
          absent: absentCount,
          attendanceRate: parseFloat(attendanceRate)
        }
      }
    });

  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance report'
    });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const member = await Member.findOne({ userId });
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }

    const { 
      page = 1, 
      limit = 30,
      startDate,
      endDate 
    } = req.query;

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
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

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

    const attendanceRate = member.totalAttendanceDays > 0 ?
      (totalAttendance / member.totalAttendanceDays * 100).toFixed(1) : 0;

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
          totalAttendance,
          thisMonthAttendance,
          attendanceRate: parseFloat(attendanceRate),
          lastAttendance: member.lastAttendance,
          membershipStartDate: member.membershipStartDate,
          totalDays: member.totalAttendanceDays
        }
      }
    });

  } catch (error) {
    console.error('My attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your attendance'
    });
  }
};

const resetTodaysAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Attendance.deleteMany({
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      message: 'Today\'s attendance reset successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Reset attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting attendance'
    });
  }
};

// Check if attendance was already submitted today
const checkTodayAttendanceStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count total active members
    const totalActiveMembers = await Member.countDocuments({ status: 'active' });

    // Count attendance records for today
    const todaysAttendanceCount = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Get attendance details for today
    const todaysAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
    .populate({
      path: 'memberId',
      select: 'memberId',
      populate: {
        path: 'userId',
        select: 'fullName'
      }
    })
    .populate('markedBy', 'fullName');

    const presentCount = todaysAttendance.filter(a => a.status === 'present').length;
    const absentCount = todaysAttendance.filter(a => a.status === 'absent').length;

    // Attendance is considered "submitted" if at least one member has been marked
    const isSubmitted = todaysAttendanceCount > 0;

    // Get submission time (first record's creation time)
    let submittedAt = null;
    let submittedBy = null;
    if (todaysAttendance.length > 0) {
      const firstRecord = todaysAttendance.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      submittedAt = firstRecord.createdAt;
      submittedBy = firstRecord.markedBy?.fullName || 'Admin';
    }

    res.json({
      success: true,
      data: {
        isSubmitted,
        submittedAt,
        submittedBy,
        todayDate: today,
        totalActiveMembers,
        markedCount: todaysAttendanceCount,
        presentCount,
        absentCount,
        canSubmit: !isSubmitted,
        attendanceRecords: todaysAttendance.map(att => ({
          memberId: att.memberId?.memberId || 'N/A',
          memberName: att.memberId?.userId?.fullName || 'Unknown',
          status: att.status,
          markedAt: att.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Check today attendance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking attendance status'
    });
  }
};

module.exports = {
  markAttendance,
  markMultipleAttendance,
  getMembersForAttendance,
  markAllPresent,
  getTodayAttendanceSummary,
  getAttendanceReport,
  getMyAttendance,
  resetTodaysAttendance,
  checkTodayAttendanceStatus
};
const Payment = require('../models/Payment.model');
const Member = require('../models/Member.model');
const User = require('../models/User.model');

const simulateEasypaisaPayment = async (amount, mobileNumber) => {
  return {
    success: true,
    transactionId: `EASY${Date.now().toString().slice(-10)}`,
    amount,
    mobileNumber,
    timestamp: new Date(),
    status: 'completed'
  };
};

const simulateJazzcashPayment = async (amount, mobileNumber) => {
  return {
    success: true,
    transactionId: `JAZZ${Date.now().toString().slice(-10)}`,
    amount,
    mobileNumber,
    timestamp: new Date(),
    status: 'completed'
  };
};

const processPayment = async (req, res) => {
  try {
    const { 
      memberId, 
      paymentMethod, 
      mobileAccount, 
      amount,
      forMonth 
    } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (amount < member.monthlyFee) {
      return res.status(400).json({
        success: false,
        message: `Payment amount must be at least PKR ${member.monthlyFee}`
      });
    }

    let paymentResult;
    let transactionId;

    if (paymentMethod === 'easypaisa') {
      if (!mobileAccount) {
        return res.status(400).json({
          success: false,
          message: 'Easypaisa mobile account number is required'
        });
      }
      
      paymentResult = await simulateEasypaisaPayment(amount, mobileAccount);
      transactionId = paymentResult.transactionId;
      
      member.easypaisaNumber = mobileAccount;
      member.paymentMethod = 'easypaisa';
      
    } else if (paymentMethod === 'jazzcash') {
      if (!mobileAccount) {
        return res.status(400).json({
          success: false,
          message: 'Jazzcash mobile account number is required'
        });
      }
      
      paymentResult = await simulateJazzcashPayment(amount, mobileAccount);
      transactionId = paymentResult.transactionId;
      
      member.jazzcashNumber = mobileAccount;
      member.paymentMethod = 'jazzcash';
      
    } else if (paymentMethod === 'cash') {
      transactionId = `CASH${Date.now().toString().slice(-8)}`;
      paymentResult = {
        success: true,
        transactionId,
        amount,
        status: 'pending'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Use easypaisa, jazzcash, or cash'
      });
    }

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing failed'
      });
    }

    const payment = await Payment.create({
      memberId: member._id,
      userId: member.userId,
      amount,
      paymentMethod,
      mobileAccount: paymentMethod !== 'cash' ? mobileAccount : undefined,
      transactionId,
      status: paymentMethod === 'cash' ? 'pending' : 'completed',
      forMonth: forMonth || new Date().toISOString().slice(0, 7),
      notes: `Membership fee for ${forMonth || 'current month'}`
    });

    member.paymentStatus = paymentMethod === 'cash' ? 'pending' : 'paid';
    member.lastPaymentDate = new Date();
    
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    member.nextPaymentDate = nextPaymentDate;
    
    if (payment.status === 'completed') {
      member.status = 'active';
    }
    
    await member.save();

    res.json({
      success: true,
      message: paymentMethod === 'cash' 
        ? 'Cash payment recorded. Please pay at reception.' 
        : 'Payment processed successfully',
      data: {
        payment: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
          status: payment.status,
          forMonth: payment.forMonth
        },
        member: {
          memberId: member.memberId,
          paymentStatus: member.paymentStatus,
          nextPaymentDate: member.nextPaymentDate
        }
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing payment'
    });
  }
};

const verifyCashPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ 
      $or: [{ paymentId }, { _id: paymentId }] 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.paymentMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Only cash payments can be verified'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already verified'
      });
    }

    payment.status = 'completed';
    payment.verifiedBy = req.user._id;
    payment.verificationDate = new Date();
    payment.receiptNumber = `RCPT${Date.now().toString().slice(-8)}`;
    await payment.save();

    const member = await Member.findById(payment.memberId);
    if (member) {
      member.paymentStatus = 'paid';
      member.status = 'active';
      await member.save();
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment: {
          paymentId: payment.paymentId,
          status: payment.status,
          verifiedBy: req.user.fullName,
          verificationDate: payment.verificationDate,
          receiptNumber: payment.receiptNumber
        }
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying payment'
    });
  }
};

const getMemberPayments = async (req, res) => {
  try {
    const { memberId } = req.params;

    const payments = await Payment.find({ memberId })
      .populate('verifiedBy', 'fullName')
      .sort({ paymentDate: -1 });

    const totalPaid = await Payment.aggregate([
      { $match: { memberId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ 
      memberId, 
      status: 'pending' 
    });

    res.json({
      success: true,
      data: {
        payments,
        statistics: {
          totalPayments: payments.length,
          totalPaid: totalPaid[0]?.total || 0,
          pendingPayments
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payments'
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }

    const payments = await Payment.find({ memberId: member._id })
      .populate('verifiedBy', 'fullName')
      .sort({ paymentDate: -1 });

    const now = new Date();
    const upcomingPayment = {
      dueDate: member.nextPaymentDate,
      amount: member.monthlyFee,
      status: now > member.nextPaymentDate ? 'overdue' : 'upcoming'
    };

    res.json({
      success: true,
      data: {
        payments,
        upcomingPayment,
        member: {
          paymentStatus: member.paymentStatus,
          lastPaymentDate: member.lastPaymentDate,
          paymentMethod: member.paymentMethod
        }
      }
    });

  } catch (error) {
    console.error('My payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your payments'
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '',
      paymentMethod = '',
      startDate,
      endDate 
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.paymentDate = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate({
        path: 'memberId',
        select: 'memberId',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      })
      .populate('verifiedBy', 'fullName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ paymentDate: -1 });

    const total = await Payment.countDocuments(query);

    const revenueStats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          completedRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] 
            } 
          },
          pendingRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] 
            } 
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total
        },
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          completedRevenue: 0,
          pendingRevenue: 0
        }
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payments'
    });
  }
};

module.exports = {
  processPayment,
  verifyCashPayment,
  getMemberPayments,
  getMyPayments,
  getAllPayments
};
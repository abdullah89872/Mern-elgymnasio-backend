const Registration = require('../models/Registration.model');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const generateToken = require('../utils/generateToken');

// Submit registration
exports.submitRegistration = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      cnic,
      age,
      gender,
      membershipPlan,
      fitnessGoals,
      medicalHistory,
      emergencyContact,
      address,
      city
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create registration
    const registration = new Registration({
      fullName,
      email,
      password,
      phone,
      cnic,
      age,
      gender,
      membershipPlan,
      fitnessGoals,
      medicalHistory,
      emergencyContact,
      address,
      city
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all pending registrations
exports.getPendingRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ status: 'pending' });
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve registration
exports.approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Create user
    const user = new User({
      fullName: registration.fullName,
      email: registration.email,
      password: registration.password,
      phone: registration.phone,
      cnic: registration.cnic,
      role: 'member'
    });

    await user.save();

    // Create member profile
    const member = new Member({
      userId: user._id,
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      age: registration.age,
      gender: registration.gender,
      membershipPlan: registration.membershipPlan,
      fitnessGoals: registration.fitnessGoals,
      medicalHistory: registration.medicalHistory,
      emergencyContact: registration.emergencyContact,
      address: registration.address,
      city: registration.city
    });

    await member.save();

    // Update registration
    registration.status = 'approved';
    registration.approvedAt = new Date();
    registration.approvedBy = req.user._id;
    await registration.save();

    res.json({
      success: true,
      message: 'Registration approved successfully',
      user,
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reject registration
exports.rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'rejected';
    await registration.save();

    res.json({
      success: true,
      message: 'Registration rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const registrations = await Registration.find(filter).sort({ registeredAt: -1 });
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get registration statistics
exports.getRegistrationStats = async (req, res) => {
  try {
    const stats = {
      total: await Registration.countDocuments(),
      pending: await Registration.countDocuments({ status: 'pending' }),
      approved: await Registration.countDocuments({ status: 'approved' }),
      rejected: await Registration.countDocuments({ status: 'rejected' })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete registration
exports.deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByIdAndDelete(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

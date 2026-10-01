require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const Member = require('./models/Member.model');
const Trainer = require('./models/Trainer.model');
const Nutritionist = require('./models/Nutritionist.model');
const connectDB = require('./config/database');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Member.deleteMany();
    await Trainer.deleteMany();
    await Nutritionist.deleteMany();

    console.log('🗑️ Cleared existing data');

    // Create hardcoded admin users
    const admins = [
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

    for (const adminData of admins) {
      const admin = await User.create(adminData);
      console.log(`✅ Created admin: ${admin.fullName}`);
    }

    // Create sample members
    const sampleMembers = [
      {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+923001234567',
        cnic: '3520112345671',
        memberData: {
          dateOfBirth: new Date('1990-05-15'),
          age: 33,
          gender: 'male',
          address: {
            street: '123 Main Street',
            city: 'Lahore',
            state: 'Punjab',
            zipCode: '54000'
          },
          emergencyContact: {
            name: 'Jane Doe',
            phone: '+923001234568',
            relationship: 'Wife'
          },
          membershipPlan: 'premium',
          monthlyFee: 4900,
          paymentMethod: 'easypaisa',
          easypaisaNumber: '03123456789',
          healthInfo: {
            weight: 75,
            height: 175,
            medicalConditions: [],
            allergies: ['None'],
            fitnessGoals: ['Weight Loss', 'Muscle Gain']
          },
          status: 'active',
          paymentStatus: 'paid'
        }
      },
      {
        fullName: 'Sarah Khan',
        email: 'sarah@example.com',
        password: 'password123',
        phone: '+923001234569',
        cnic: '3520112345672',
        memberData: {
          dateOfBirth: new Date('1995-08-22'),
          age: 28,
          gender: 'female',
          address: {
            street: '456 Park Road',
            city: 'Karachi',
            state: 'Sindh',
            zipCode: '75500'
          },
          emergencyContact: {
            name: 'Ali Khan',
            phone: '+923001234570',
            relationship: 'Brother'
          },
          membershipPlan: 'vip',
          monthlyFee: 7900,
          paymentMethod: 'jazzcash',
          jazzcashNumber: '03001234567',
          healthInfo: {
            weight: 60,
            height: 165,
            medicalConditions: ['Asthma'],
            allergies: ['Dust'],
            fitnessGoals: ['Cardio Health', 'Flexibility']
          },
          status: 'active',
          paymentStatus: 'paid'
        }
      }
    ];

    for (const memberData of sampleMembers) {
      const user = await User.create({
        fullName: memberData.fullName,
        email: memberData.email,
        password: memberData.password,
        phone: memberData.phone,
        cnic: memberData.cnic,
        role: 'member',
        isVerified: true
      });

      const member = await Member.create({
        userId: user._id,
        ...memberData.memberData
      });

      console.log(`✅ Created member: ${member.memberId} - ${user.fullName}`);
    }

    // Create sample trainer
    const trainerUser = await User.create({
      fullName: 'Mike Johnson',
      email: 'mike.trainer@elgymnasio.com',
      password: 'trainer123',
      phone: '+923001234571',
      role: 'trainer',
      isVerified: true
    });

    const trainer = await Trainer.create({
      userId: trainerUser._id,
      specialization: ['Strength Training', 'Weight Loss', 'Body Building'],
      qualification: 'Certified Personal Trainer',
      certification: 'ACE Certified',
      yearsOfExperience: 5,
      hourlyRate: 1500,
      schedule: [
        { day: 'monday', startTime: '09:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'friday', startTime: '09:00', endTime: '17:00' }
      ],
      bio: 'Specializes in strength training and muscle building',
      status: 'active'
    });

    console.log(`✅ Created trainer: ${trainer.trainerId} - ${trainerUser.fullName}`);

    // Create sample nutritionist
    const nutritionistUser = await User.create({
      fullName: 'Dr. Emily Chen',
      email: 'emily.nutritionist@elgymnasio.com',
      password: 'nutrition123',
      phone: '+923001234572',
      role: 'nutritionist',
      isVerified: true
    });

    const nutritionist = await Nutritionist.create({
      userId: nutritionistUser._id,
      specialization: ['Sports Nutrition', 'Weight Management', 'Diet Planning'],
      qualification: 'PhD in Sports Nutrition',
      certification: 'Registered Dietitian',
      yearsOfExperience: 8,
      consultationFee: 2000,
      schedule: [
        { day: 'tuesday', startTime: '10:00', endTime: '18:00' },
        { day: 'thursday', startTime: '10:00', endTime: '18:00' },
        { day: 'saturday', startTime: '10:00', endTime: '15:00' }
      ],
      bio: 'Specialized in sports nutrition and meal planning',
      status: 'active'
    });

    console.log(`✅ Created nutritionist: ${nutritionist.nutritionistId} - ${nutritionistUser.fullName}`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('Admin Login:');
    console.log('  Email: admin@elgymnasio.com');
    console.log('  Password: admin123');
    console.log('  Admin Code: ELGYM2024');
    console.log('\nMember Login:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');
    console.log('\n🚀 Server ready to run!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
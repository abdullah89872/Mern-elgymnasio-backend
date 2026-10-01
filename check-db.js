const mongoose = require('mongoose');
require('dotenv').config();

const Registration = require('./models/Registration.model');
const Member = require('./models/Member.model');
const User = require('./models/User.model');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('========== REGISTRATIONS ==========');
    const registrations = await Registration.find({}).select('fullName email phone').lean();
    registrations.forEach((r, i) => {
      console.log(`${i + 1}. Email: ${r.email}`);
      console.log(`   Name: ${r.fullName}`);
      console.log(`   Phone: ${r.phone || 'N/A'}`);
      console.log('');
    });
    console.log(`Total Registrations: ${registrations.length}\n`);

    console.log('========== MEMBERS ==========');
    const members = await Member.find({}).select('name email phone memberId membershipPlan membershipStatus').lean();
    members.forEach((m, i) => {
      console.log(`${i + 1}. Member ID: ${m.memberId}`);
      console.log(`   Email: ${m.email}`);
      console.log(`   Name: ${m.name}`);
      console.log(`   Plan: ${m.membershipPlan}`);
      console.log(`   Status: ${m.membershipStatus}`);
      console.log('');
    });
    console.log(`Total Members: ${members.length}\n`);

    console.log('========== VALID VIEW PROFILE CREDENTIALS ==========');
    for (const member of members) {
      // Find matching registration
      const reg = registrations.find(r => r.email.toLowerCase() === member.email.toLowerCase());
      if (reg) {
        console.log(`Username: ${member.email}`);
        console.log(`Full Name: ${reg.fullName}`);
        console.log('---');
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();

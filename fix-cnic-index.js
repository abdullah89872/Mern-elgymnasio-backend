// Script to drop the CNIC unique index from MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('./models/Registration.model');
const User = require('./models/User.model');

const fixCnicIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elgymnasio';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Dropping CNIC unique index if it exists...');
    
    // Fix Registration collection
    try {
      await Registration.collection.dropIndex('cnic_1');
      console.log('✓ CNIC unique index dropped from Registration collection');
    } catch (indexError) {
      if (indexError.code === 27) {
        console.log('✓ CNIC index does not exist in Registration (already clean)');
      } else {
        console.warn('Warning:', indexError.message);
      }
    }

    // Fix User collection
    try {
      await User.collection.dropIndex('cnic_1');
      console.log('✓ CNIC unique index dropped from User collection');
    } catch (indexError) {
      if (indexError.code === 27) {
        console.log('✓ CNIC index does not exist in User (already clean)');
      } else {
        console.warn('Warning:', indexError.message);
      }
    }

    console.log('\nFixing complete! You can now register users without CNIC errors.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

fixCnicIndex();

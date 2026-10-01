const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the User collection
    const userCollection = mongoose.connection.collection('users');

    // Drop the old unique index on cnic
    try {
      await userCollection.dropIndex('cnic_1');
      console.log('✅ Dropped old cnic_1 index');
    } catch (error) {
      console.log('⚠️  cnic_1 index does not exist or could not be dropped:', error.message);
    }

    // Create a new sparse unique index on cnic
    await userCollection.createIndex({ cnic: 1 }, { unique: true, sparse: true });
    console.log('✅ Created new sparse unique index on cnic');

    console.log('\n✅ All indexes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();

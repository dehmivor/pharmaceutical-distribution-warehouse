const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/pharmaceutical-warehouse');
    console.log('Connected to MongoDB for migration');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const migrateImportOrderContract = async () => {
  try {
    console.log('Starting migration: supplier_contract_id -> contract_id...');
    
    // Get ImportOrder collection
    const db = mongoose.connection.db;
    const collection = db.collection('importorders');
    
    // Find all documents that have supplier_contract_id field
    const documentsToUpdate = await collection.find({ 
      supplier_contract_id: { $exists: true } 
    }).toArray();
    
    console.log(`Found ${documentsToUpdate.length} documents to migrate`);
    
    if (documentsToUpdate.length === 0) {
      console.log('No documents to migrate');
      return;
    }
    
    // Use bulk operations for efficiency
    const bulkOps = documentsToUpdate.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $rename: { supplier_contract_id: 'contract_id' }
        }
      }
    }));
    
    const result = await collection.bulkWrite(bulkOps);
    
    console.log(`Migration completed successfully:`);
    console.log(`- Modified: ${result.modifiedCount} documents`);
    console.log(`- Matched: ${result.matchedCount} documents`);
    
    // Verify migration
    const verifyCount = await collection.countDocuments({ contract_id: { $exists: true } });
    const oldFieldCount = await collection.countDocuments({ supplier_contract_id: { $exists: true } });
    
    console.log(`Verification:`);
    console.log(`- Documents with contract_id: ${verifyCount}`);
    console.log(`- Documents with old supplier_contract_id: ${oldFieldCount}`);
    
    if (oldFieldCount === 0) {
      console.log('✅ Migration verified successfully - no old fields remain');
    } else {
      console.log('⚠️  Warning: Some documents still have old field names');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await migrateImportOrderContract();
    console.log('Migration script completed');
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateImportOrderContract }; 
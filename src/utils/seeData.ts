import { Data } from '../models/dataPlans';
import { dataList } from '../config/dataList';
import mongoose from 'mongoose';

export const seedData = async () => {
  try {
    // Clear existing data to avoid duplicates
    console.log('🗑️ Clearing existing data...');
    await Data.deleteMany({});
    
    console.log('🌱 Starting data seeding...');
    let totalSeeded = 0;
    
    // Debug: Log all available providers
    console.log('📋 Available providers:', Object.keys(dataList));
    
    for (const [provider, bundles] of Object.entries(dataList)) {
      console.log(`📡 Seeding ${provider} plans... (${bundles.length} plans)`);
      let providerCount = 0;
      
      for (const plan of bundles) {
        // Debug: Log each plan being processed
        console.log(`   Processing: ${plan.size} - ${plan.serviceType} - ${plan.duration} - ${plan.price}`);
        
        // Validate required fields before saving
        if (!plan.size || !plan.serviceType || !plan.duration || !plan.price) {
          console.warn(`⚠️ Skipping invalid plan for ${provider}:`, plan);
          continue;
        }

        try {
          const data = new Data({
            networkProvider: provider,
            size: plan.size,
            serviceType: plan.serviceType,
            duration: plan.duration,
            price: plan.price,
            setBy: "admin" // Added missing setBy field
          });

          await data.save();
          totalSeeded++;
          providerCount++;
        } catch (saveError) {
          console.error(`❌ Error saving plan for ${provider}:`, saveError);
        }
      }
      
      console.log(`✅ ${provider} plans seeded successfully (${providerCount} plans)`);
    }

    console.log(`🎉 Data seeding completed! Total plans seeded: ${totalSeeded}`);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    throw err;
  }
};

// Fixed bulk insert version - more efficient for large datasets
export const seedDataBulk = async () => {
  try {
    console.log('🗑️ Clearing existing data...');
    await Data.deleteMany({});
    
    console.log('🌱 Starting bulk data seeding...');
    const allPlans = [];
    
    // Build array of all plans from all providers
    for (const [networkProvider, plans] of Object.entries(dataList)) {
      console.log(`📋 Preparing ${networkProvider} plans... (${plans.length} plans)`);
      
      for (const plan of plans) {
        // Validate required fields
        if (!plan.size || !plan.serviceType || !plan.duration || !plan.price) {
          console.warn(`⚠️ Skipping invalid plan for ${networkProvider}:`, plan);
          continue;
        }

        allPlans.push({
          networkProvider,
          size: plan.size,
          duration: plan.duration,
          price: plan.price,
          serviceType: plan.serviceType,
          setBy: "admin",
          createdAt: new Date()
        });
      }
    }

    // Bulk insert all plans at once
    if (allPlans.length > 0) {
      console.log(`💾 Bulk inserting ${allPlans.length} plans...`);
      const result = await Data.insertMany(allPlans, { ordered: false });
      console.log(`🎉 Bulk seeding completed! Total plans seeded: ${result.length}`);
      
      // Log summary by provider
      const summary = allPlans.reduce((acc, plan) => {
        acc[plan.networkProvider] = (acc[plan.networkProvider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 Seeding summary by provider:', summary);
    } else {
      console.log('⚠️ No valid plans found to seed');
    }
    
  } catch (err) {
    console.error('❌ Error in bulk seeding:', err);
    throw err;
  }
};

// Version with upsert (update if exists, insert if not)
export const seedDataUpsert = async () => {
  try {
    console.log('🌱 Starting data seeding with upsert...');
    let upserted = 0;
    let updated = 0;
    
    for (const [provider, bundles] of Object.entries(dataList)) {
      console.log(`📡 Processing ${provider} plans...`);
      
      for (const plan of bundles) {
        if (!plan.size || !plan.serviceType || !plan.duration || !plan.price) {
          console.warn(`⚠️ Skipping invalid plan for ${provider}:`, plan);
          continue;
        }

        try {
          const result = await Data.findOneAndUpdate(
            {
              networkProvider: provider,
              size: plan.size,
              serviceType: plan.serviceType,
              duration: plan.duration
            },
            {
              networkProvider: provider,
              size: plan.size,
              serviceType: plan.serviceType,
              duration: plan.duration,
              price: plan.price,
              setBy: "admin"
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );
          
          // Check if this was a new document (MongoDB doesn't have isNew on findOneAndUpdate)
          // We'll count all as upserted since we can't easily distinguish
          upserted++;
          
        } catch (saveError) {
          console.error(`❌ Error upserting plan for ${provider}:`, saveError);
        }
      }
      
      console.log(`✅ ${provider} plans processed`);
    }

    console.log(`🎉 Upsert seeding completed! Total operations: ${upserted}`);
  } catch (err) {
    console.error('❌ Error in upsert seeding:', err);
    throw err;
  }
};

// Verification function to check what was actually seeded
export const verifySeededData = async () => {
  try {
    console.log('🔍 Verifying seeded data...');
    
    const totalCount = await Data.countDocuments();
    console.log(`📊 Total documents in database: ${totalCount}`);
    
    // Count by provider
    const providers = await Data.aggregate([
      {
        $group: {
          _id: '$networkProvider',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('📋 Count by provider:');
    providers.forEach(p => {
      console.log(`   ${p._id}: ${p.count} plans`);
    });
    
    // Count by service type
    const serviceTypes = await Data.aggregate([
      {
        $group: {
          _id: { provider: '$networkProvider', serviceType: '$serviceType' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.provider': 1, '_id.serviceType': 1 }
      }
    ]);
    
    console.log('📋 Count by service type:');
    serviceTypes.forEach(st => {
      console.log(`   ${st._id.provider} - ${st._id.serviceType}: ${st.count} plans`);
    });
    
  } catch (err) {
    console.error('❌ Error verifying data:', err);
  }
};

// Usage with proper error handling and database connection
export const runSeeding = async () => {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
      console.log('📊 Connected to MongoDB');
    }

    // Choose your preferred seeding method:
    await seedDataBulk();       // Recommended: Bulk insert (fastest)
    // await seedData();        // Alternative: Individual saves
    // await seedDataUpsert();  // Alternative: Upsert (prevents duplicates)
    
    // Verify the results
    await verifySeededData();
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  runSeeding();
}
import CableTV from "./models/TV"
const cableServiceData = {
  gotv: [
    {
      value: 'gotv-max',
      price: '8500.00',
      display_name: 'GOtv Max N8,500'
    },
    {
      value: 'gotv-jolli',
      price: '5800.00',
      display_name: 'GOtv Jolli N5,800'
    },
    {
      value: 'gotv-jinja',
      price: '3900.00',
      display_name: 'GOtv Jinja N3,900'
    },
    {
      value: 'gotv-smallie',
      price: '1900.00',
      display_name: 'GOtv Smallie - monthly N1900'
    },
    {
      value: 'gotv-smallie-3months',
      price: '5100.00',
      display_name: 'GOtv Smallie - quarterly N5,100'
    },
    {
      value: 'gotv-smallie-1year',
      price: '15000.00',
      display_name: 'GOtv Smallie - yearly N15,000'
    },
    {
      value: 'gotv-supa',
      price: '11400.00',
      display_name: 'GOtv Supa - monthly N11,400'
    },
    {
      value: 'gotv-supa-plus',
      price: '16800.00',
      display_name: 'GOtv Supa Plus - monthly N16,800'
    }
  ],
  startimes: [
    {
      value: 'nova',
      price: '2100.00',
      display_name: 'Nova (Dish) - 1 Month'
    },
    {
      value: 'basic',
      price: '4000.00',
      display_name: 'Basic (Antenna) - 4,000 Naira - 1 Month'
    },
    {
      value: 'smart',
      price: '5100.00',
      display_name: 'Basic (Dish) - 5,100 Naira - 1 Month'
    },
    {
      value: 'classic',
      price: '6000.00',
      display_name: 'Classic (Antenna) - 1 Month'
    },
    {
      value: 'super',
      price: '9800.00',
      display_name: 'Super (Dish) - 9,800 Naira - 1 Month'
    },
    {
      value: 'nova-weekly',
      price: '700.00',
      display_name: 'Nova (Antenna) - 1 Week'
    },
    {
      value: 'basic-weekly',
      price: '1400.00',
      display_name: 'Basic (Antenna) - 1 Week'
    },
    {
      value: 'smart-weekly',
      price: '1700.00',
      display_name: 'Basic (Dish) - 1,700 Naira - 1 Week'
    },
    {
      value: 'classic-weekly',
      price: '2000.00',
      display_name: 'Classic (Antenna) - 1 Week'
    },
    {
      value: 'super-weekly',
      price: '3300.00',
      display_name: 'Super (Dish) - 3,300 Naira - 1 Week'
    },
    {
      value: 'uni-1',
      price: '21000.00',
      display_name: 'Chinese (Dish) - 21,000 Naira - 1 month'
    },
    {
      value: 'uni-2',
      price: '2100.00',
      display_name: 'Nova (Antenna) - 2,100 Naira - 1 Month'
    },
    {
      value: 'special-weekly',
      price: '2300.00',
      display_name: 'Classic (Dish) - 1 Week'
    },
    {
      value: 'special-monthly',
      price: '7400.00',
      display_name: 'Classic (Dish) - 1 Month'
    },
    {
      value: 'nova-dish-weekly',
      price: '700.00',
      display_name: 'Nova (Dish) - 1 Week'
    },
    {
      value: 'super-antenna-weekly',
      price: '3200.00',
      display_name: 'Super (Antenna) - 3,200 Naira - 1 Week'
    },
    {
      value: 'super-antenna-monthly',
      price: '9500.00',
      display_name: 'Super (Antenna) - 9,500 Naira - 1 Month'
    },
    {
      value: 'classic-weekly-dish',
      price: '2500.00',
      display_name: 'Classic (Dish) - 1 Week'
    },
    {
      value: 'global-monthly-dish',
      price: '21000.00',
      display_name: 'Global (Dish) - 1 Month'
    },
    {
      value: 'global-weekly-dish',
      price: '7000.00',
      display_name: 'Global (Dish) - 1Week'
    },
    {
      value: 'shs-weekly-2800',
      price: '2800.00',
      display_name: 'Startimes SHS - 2,800 Naira - Weekly'
    },
    {
      value: 'shs-weekly-4620',
      price: '4620.00',
      display_name: 'Startimes SHS - 4,620 Naira - Weekly'
    },
    {
      value: 'shs-weekly-4900',
      price: '4900.00',
      display_name: 'Startimes SHS - 4,900 Naira - Weekly'
    },
    {
      value: 'shs-weekly-9100',
      price: '9100.00',
      display_name: 'Startimes SHS - 9,100 Naira - Weekly'
    },
    {
      value: 'shs-monthly-12000',
      price: '12000.00',
      display_name: 'Startimes SHS - 12,000 Naira - Monthly'
    },
    {
      value: 'shs-monthly-19800',
      price: '19800.00',
      display_name: 'Startimes SHS - 19,800 Naira - Monthly'
    },
    {
      value: 'shs-monthly-21000',
      price: '21000.00',
      display_name: 'Startimes SHS - 21,000 Naira - Monthly'
    },
    {
      value: 'shs-monthly-39000',
      price: '39000.00',
      display_name: 'Startimes SHS - 39,000 Naira - Monthly'
    }
  ],
  dstv: [
    {
      value: 'dstv-padi',
      price: '4400.00',
      display_name: 'DStv Padi N4,400'
    },
    {
      value: 'dstv-yanga',
      price: '6000.00',
      display_name: 'DStv Yanga N6,000'
    },
    {
      value: 'dstv-confam',
      price: '11000.00',
      display_name: 'Dstv Confam N11,000'
    },
    {
      value: 'dstv79',
      price: '19000.00',
      display_name: 'DStv  Compact N19,000'
    },
    {
      value: 'dstv3',
      price: '44500.00',
      display_name: 'DStv Premium N44,500'
    },
    {
      value: 'dstv7',
      price: '30000.00',
      display_name: 'DStv Compact Plus N30,000'
    },
    {
      value: 'dstv9',
      price: '69000.00',
      display_name: 'DStv Premium-French N69,000'
    },
    {
      value: 'dstv10',
      price: '50500.00',
      display_name: 'DStv Premium-Asia N50,500'
    },
    {
      value: 'confam-extra',
      price: '17000.00',
      display_name: 'DStv Confam + ExtraView N17,000'
    },
    {
      value: 'yanga-extra',
      price: '12000.00',
      display_name: 'DStv Yanga + ExtraView N12,000'
    },
    {
      value: 'padi-extra',
      price: '10400.00',
      display_name: 'DStv Padi + ExtraView N10,400'
    },
    {
      value: 'dstv30',
      price: '25000.00',
      display_name: 'DStv Compact + Extra View N25,000'
    },
    {
      value: 'com-frenchtouch',
      price: '26000.00',
      display_name: 'DStv Compact + French Touch N26,000'
    },
    {
      value: 'dstv33',
      price: '50500.00',
      display_name: 'DStv Premium + Extra View N50,500'
    },
    {
      value: 'com-frenchtouch-extra',
      price: '32000.00',
      display_name: 'DStv Compact + French Touch + ExtraView N32,000'
    },
    {
      value: 'dstv43',
      price: '54500.00',
      display_name: 'DStv Compact Plus + French Plus N54,500'
    },
    {
      value: 'complus-frenchtouch',
      price: '37000.00',
      display_name: 'DStv Compact Plus + French Touch N37,000'
    },
    {
      value: 'dstv45',
      price: '36000.00',
      display_name: 'DStv Compact Plus + Extra View N36,000'
    },
    {
      value: 'complus-french-extraview',
      price: '60500.00',
      display_name: 'DStv Compact Plus + FrenchPlus + Extra View N60,500'
    },
    {
      value: 'dstv47',
      price: '43500.00',
      display_name: 'DStv Compact + French Plus N43,500'
    },
    {
      value: 'dstv62',
      price: '75000.00',
      display_name: 'DStv Premium + French + Extra View N75,000'
    },
    {
      value: 'frenchplus-addon',
      price: '24500.00',
      display_name: 'DStv French Plus Add-on N24,500'
    },
    {
      value: 'dstv-greatwall',
      price: '3800.00',
      display_name: 'DStv Great Wall Standalone Bouquet N3,800'
    },
    {
      value: 'frenchtouch-addon',
      price: '7000.00',
      display_name: 'DStv French Touch Add-on N7,000'
    },
    {
      value: 'extraview-access',
      price: '6000.00',
      display_name: 'ExtraView Access N6,000'
    },
    {
      value: 'dstv-yanga-showmax',
      price: '7750.00',
      display_name: 'DStv Yanga + Showmax N7,750'
    },
    {
      value: 'dstv-greatwall-showmax',
      price: '7300.00',
      display_name: 'DStv Great Wall Standalone Bouquet + Showmax N7,300'
    },
    {
      value: 'dstv-compact-plus-showmax',
      price: '31750.00',
      display_name: 'DStv Compact Plus + Showmax N31,750'
    },
    {
      value: 'dstv-confam-showmax',
      price: '12750.00',
      display_name: 'Dstv Confam + Showmax N12,750'
    },
    {
      value: 'dstv-compact-showmax',
      price: '20750.00',
      display_name: 'DStv  Compact + Showmax N20,750'
    },
    {
      value: 'dstv-padi-showmax',
      price: '7900.00',
      display_name: 'DStv Padi + Showmax N7,900'
    },
    {
      value: 'dstv-asia-showmax',
      price: '18400.00',
      display_name: 'DStv Asia + Showmax N18,400'
    },
    {
      value: 'dstv-premium-french-showmax',
      price: '69000.00',
      display_name: 'DStv Premium + French + Showmax N69,000'
    },
    {
      value: 'dstv-premium-showmax',
      price: '44500.00',
      display_name: 'DStv Premium + Showmax N44,500'
    },
    {
      value: 'dstv-indian',
      price: '14900.00',
      display_name: 'DStv Indian N14,900'
    },
    {
      value: 'dstv-premium-indian',
      price: '16530.00',
      display_name: 'DStv Premium East Africa and Indian N16530'
    },
    {
      value: 'dstv-fta-plus',
      price: '1600.00',
      display_name: 'DStv FTA Plus N1,600'
    },
    {
      value: 'dstv-premium-hd',
      price: '39000.00',
      display_name: 'DStv PREMIUM HD N39,000'
    },
    {
      value: 'dstv-access-1',
      price: '2000.00',
      display_name: 'DStv Access N2000'
    },
    {
      value: 'dstv-family-1',
      price: '4000.00',
      display_name: 'DStv Family'
    },
    {
      value: 'dstv-indian-add-on',
      price: '14900.00',
      display_name: 'DStv India Add-on N14,900'
    },
    {
      value: 'dstv-mobile-1',
      price: '790.00',
      display_name: 'DSTV MOBILE N790'
    },
    {
      value: 'dstv-movie-bundle-add-on',
      price: '3500.00',
      display_name: 'DStv Movie Bundle Add-on N3500'
    },
    {
      value: 'dstv-pvr-access',
      price: '4000.00',
      display_name: 'DStv PVR Access Service N4000'
    },
    {
      value: 'dstv-premium-wafr-showmax',
      price: '50500.00',
      display_name: 'DStv Premium W/Afr + Showmax N50,500'
    }
  ]
};

// Helper function to extract service type from display name
function extractServiceType(displayName: string, provider: string): string {
  // Remove price information and clean up the display name
  let serviceType = displayName
    .replace(/N[\d,]+/g, '') // Remove Nigerian Naira prices
    .replace(/- \d+.*$/g, '') // Remove duration info like "- 1 Month"
    .replace(/\d+,?\d* Naira.*$/g, '') // Remove other price formats
    .trim();
    
  // Remove redundant provider prefix
  serviceType = serviceType.replace(new RegExp(`^${provider}\\s*`, 'i'), '').trim();
  
  return serviceType;
}

// Helper function to generate description based on service details
function generateDescription(displayName: string, provider: string): string {
  const providerName = provider.toUpperCase();
  
  // Extract duration and pricing info for description
  const durationMatch = displayName.match(/(weekly|monthly|quarterly|yearly|\d+\s*(week|month|year)s?)/i);
  const priceMatch = displayName.match(/N([\d,]+)/);
  
  let description = `${providerName} subscription service`;
  
  if (durationMatch) {
    description += ` with ${durationMatch[1].toLowerCase()} billing`;
  }
  
  if (priceMatch) {
    description += ` priced at ₦${priceMatch[1]}`;
  }
  
  return description;
}

// Transform raw data to match schema
function transformDataForSeeding() {
  const transformedData: Array<{
    provider: string;
    title: string;
    serviceType: string;
    price: number;
    description: string;
  }> = [];

  // Process each provider's data
  Object.entries(cableServiceData).forEach(([provider, services]) => {
    services.forEach((service) => {
      const transformedService = {
        provider: provider.toLowerCase(),
        title: service.display_name,
        serviceType: service.value,
        price: parseFloat(service.price),
        description: generateDescription(service.display_name, provider)
      };
      
      transformedData.push(transformedService);
    });
  });

  return transformedData;
}

// Main seed function
export async function seedCableTVData(): Promise<void> {
  try {
    console.log('🌱 Starting Cable TV data seeding...');

    // Clear existing data
    const deletedCount = await CableTV.deleteMany({});
    console.log(`🗑️ Cleared ${deletedCount.deletedCount} existing records`);

    // Transform and prepare data
    const seedData = transformDataForSeeding();
    console.log(`📊 Prepared ${seedData.length} records for seeding`);

    // Insert new data
    const insertedData = await CableTV.insertMany(seedData);
    console.log(`✅ Successfully seeded ${insertedData.length} Cable TV services`);

    // Display summary by provider
    const summary = await CableTV.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📈 Seeding Summary:');
    console.log('==================');
    summary.forEach((stat: any) => {
      console.log(`${stat._id.toUpperCase()}:`);
      console.log(`  - Records: ${stat.count}`);
      console.log(`  - Price range: ₦${stat.minPrice} - ₦${stat.maxPrice}`);
      console.log(`  - Average price: ₦${Math.round(stat.avgPrice)}`);
      console.log('');
    });

    console.log('🎉 Cable TV data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding Cable TV data:', error);
    throw error;
  }
}

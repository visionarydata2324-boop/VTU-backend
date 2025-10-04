export const dataList: {
  [key: string]: { displayName: string, size: string; serviceType: string; duration?: string; price?: string }[];
} = {
  
GLO: [
  { displayName: '200 MB - 14days', size: '200MB', price: '120', serviceType: 'glo_data', duration: '14days' },
  { displayName: '500MB - 30days', size: '500MB', price: '200', serviceType: 'glo_data', duration: '30days' },
  { displayName: '1GB - 3days', size: '1GB', price: '277', serviceType: 'glo_data', duration: '3days' },
  { displayName: '1GB - 7days', size: '1GB', price: '323', serviceType: 'glo_data', duration: '7days' },
  { displayName: '1GB - 30days', size: '1GB', price: '399', serviceType: 'glo_data', duration: '30days' },
  { displayName: '2GB - 30days', size: '2GB', price: '798', serviceType: 'glo_data', duration: '30days' },
  { displayName: '3GB - 3days', size: '3GB', price: '831', serviceType: 'glo_data', duration: '3days' },
  { displayName: '3GB - 7days', size: '3GB', price: '969', serviceType: 'glo_data', duration: '7days' },
  { displayName: '3GB - 30days', size: '3GB', price: '1197', serviceType: 'glo_data', duration: '30days' },
  { displayName: '5GB - 3days', size: '5GB', price: '1385', serviceType: 'glo_data', duration: '3days' },
  { displayName: '5GB - 7days', size: '5GB', price: '1615', serviceType: 'glo_data', duration: '7days' },
  { displayName: '5GB - 30days', size: '5GB', price: '1995', serviceType: 'glo_data', duration: '30days' },
  { displayName: '10GB - 30days', size: '10GB', price: '3990', serviceType: 'glo_data', duration: '30days' },

  { displayName: '750mb - 1day', size: '750MB', price: '189', serviceType: 'glo_sme', duration: '1day' },
  { displayName: '1.5GB - 1day', size: '1.5GB', price: '284', serviceType: 'glo_sme', duration: '1day' },
  { displayName: '2.5GB - 2days', size: '2.5GB', price: '473', serviceType: 'glo_sme', duration: '2days' },
  { displayName: '10GB - 7days', size: '10GB', price: '1890', serviceType: 'glo_sme', duration: '7days' },
],

MTN: [
  { displayName: '500MB - 30days', size: '500MB', price: '419', serviceType: 'mtn_sme', duration: '30days' },
  { displayName: '1GB - 30days', size: '1GB', price: '619', serviceType: 'mtn_sme', duration: '30days' },
  { displayName: '2GB - 30days', size: '2GB', price: '1239', serviceType: 'mtn_sme', duration: '30days' },
  { displayName: '3GB - 30days', size: '3GB', price: '1799', serviceType: 'mtn_sme', duration: '30days' },
  { displayName: '5GB - 30days', size: '5GB', price: '2499', serviceType: 'mtn_sme', duration: '30days' },

  { displayName: '750MB + Free 1hr (YT/IG/TT) - 3 Days', size: '750MB', price: '436', serviceType: 'mtn_gifting', duration: '3days' },
  { displayName: '1.2GB All Social - 30days', size: '1.2GB', price: '436', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '1GB + 1.5mins call time - 1day', size: '1GB', price: '486', serviceType: 'mtn_gifting', duration: '1day' },
  { displayName: '1.5GB - 2days', size: '1.5GB', price: '582', serviceType: 'mtn_gifting', duration: '2days' },
  { displayName: '1GB - 30days', size: '1GB', price: '619', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '2.5GB - 1Day', size: '2.5GB', price: '727', serviceType: 'mtn_gifting', duration: '1day' },
  { displayName: '2.5GB - 2days', size: '2.5GB', price: '873', serviceType: 'mtn_gifting', duration: '2days' },
  { displayName: '1.5GB -7days', size: '1.5GB', price: '970', serviceType: 'mtn_gifting', duration: '7days' },
  { displayName: '3.2GB - 2Days', size: '3.2GB', price: '970', serviceType: 'mtn_gifting', duration: '2days' },
  { displayName: '2GB - 30days', size: '2GB', price: '1239', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '3.5GB - 7days', size: '3.5GB', price: '1455', serviceType: 'mtn_gifting', duration: '7days' },
  { displayName: '3GB - 30days', size: '3GB', price: '1799', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '6GB - 7Days', size: '6GB', price: '2430', serviceType: 'mtn_gifting', duration: '7days' },
  { displayName: '5GB - 30days', size: '5GB', price: '2499', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '6.75 - 30days (XtraValue)', size: '6.75GB', price: '2910', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '11GB - 7days', size: '11GB', price: '3395', serviceType: 'mtn_gifting', duration: '7days' },
  { displayName: '7GB - 30days', size: '7GB', price: '3395', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '10GB + 10mins calltime - 30days', size: '10GB', price: '4320', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '14.5GB - 30days (XtraValue)', size: '14.5GB', price: '4850', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '20GB - 7days', size: '20GB', price: '4850', serviceType: 'mtn_gifting', duration: '7days' },
  { displayName: '12.5GB - 30days', size: '12.5GB', price: '5335', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '16.5GB + 25mins - 30days', size: '16.5GB', price: '6305', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '20GB - 30days', size: '20GB', price: '7275', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '25GB - 30days', size: '25GB', price: '8730', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '36GB - 30days', size: '36GB', price: '10671', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '65GB - 30days', size: '65GB', price: '15520', serviceType: 'mtn_gifting', duration: '30days' },
  { displayName: '75GB - 30days', size: '75GB', price: '17460', serviceType: 'mtn_gifting', duration: '30days' },
  
  { displayName: '500MB - 30days', size: '500MB', price: '760', serviceType: 'mtn_datashare', duration: '30days' },
  { displayName: '1GB - 30days', size: '1GB', price: '940', serviceType: 'mtn_datashare', duration: '30days' },
  { displayName: '2GB - 30days', size: '2GB', price: '2200', serviceType: 'mtn_datashare', duration: '30days' },
  { displayName: '3GB - 30days', size: '3GB', price: '3240', serviceType: 'mtn_datashare', duration: '30days' },
  { displayName: '5GB - 30days', size: '5GB', price: '3700', serviceType: 'mtn_datashare', duration: '30days' }
],

AIRTEL: [
  { displayName: '300MB - 2 days', size: '300MB', price: '105', serviceType: 'airtel_sme', duration: '2days' },
  { displayName: '600MB - 2 days', size: '600MB', price: '205', serviceType: 'airtel_sme', duration: '2days' },
  { displayName: '1GB - 3days (Social)', size: '1GB', price: '305', serviceType: 'airtel_sme', duration: '3days' },
  { displayName: '1.5GB - 1day', size: '1.5GB', price: '405', serviceType: 'airtel_sme', duration: '1day' },
  { displayName: '2GB - 1day', size: '2GB', price: '505', serviceType: 'airtel_sme', duration: '1day' },
  { displayName: '3GB- 2days', size: '3GB', price: '755', serviceType: 'airtel_sme', duration: '2days' },
  { displayName: '3.5GB- 7days', size: '3.5GB', price: '1510', serviceType: 'airtel_sme', duration: '7days' },
  { displayName: '7GB - 7days', size: '7GB', price: '2010', serviceType: 'airtel_sme', duration: '7days' },
  { displayName: '10GB - 30days', size: '10GB', price: '3010', serviceType: 'airtel_sme', duration: '30days' }
],

'9MOBILE': [
  { displayName: '500MB - 30days', size: '500MB', price: '180', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '1GB for 30 Days', size: '1GB', price: '359', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '1.5GB - 30 Days', size: '1.5GB', price: '538', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '2GB - 30days', size: '2GB', price: '718', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '3GB - 30days', size: '3GB', price: '1077', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '4GB - 30 Days', size: '4GB', price: '1436', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '4.5GB - 30days', size: '4.5GB', price: '1616', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '5GB for 30 Days', size: '5GB', price: '1795', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '10GB - 30days', size: '10GB', price: '3590', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '11GB - 30days', size: '11GB', price: '3949', serviceType: 'etisalat_data', duration: '30days' },
  { displayName: '20GB - 30days', size: '20GB', price: '7180', serviceType: 'etisalat_data', duration: '30days' }
]

};
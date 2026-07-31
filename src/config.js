/**
 * App configuration for maintenance mode and other global settings
 */
export const config = {
    // Set to true to show the Coming Soon page
    isMaintenanceMode:false,
    
    // Target launch date for the countdown timer (YYYY-MM-DD format)
    launchDate: '2026-05-01',
    
    // Social links for the Coming Soon page
    socialLinks: {
        instagram: 'https://instagram.com/visioncart',
        facebook: 'https://facebook.com/visioncart',
        twitter: 'https://twitter.com/visioncart',
        linkedin: 'https://linkedin.com/company/visioncart'
    },
    
    // Contact email for inquiries during maintenance
    contactEmail: 'visionkart.onlinestore@gmail.com',

    // Production Payment Backend URL for CCAvenue
    paymentBackendUrl: 'https://visioncardbackend.onrender.com'
};

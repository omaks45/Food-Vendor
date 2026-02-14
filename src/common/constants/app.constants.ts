/* eslint-disable prettier/prettier */
export const AppConstants = {
  // OTP Configuration
    OTP: {
        LENGTH: 6,
        EXPIRY_MINUTES: 10,
        RESEND_COOLDOWN_MINUTES: 2,
        MAX_ATTEMPTS: 5,
    },
    
    // Password Configuration
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true,
        SALT_ROUNDS: 12,
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
    
    // Cache TTL (in seconds)
    CACHE_TTL: {
        CATEGORIES: 900, // 15 minutes
        MENU_ITEMS: 300, // 5 minutes
        SINGLE_ITEM: 600, // 10 minutes
        USER_CART: 1800, // 30 minutes
        USER_SESSION: 604800, // 7 days
    },
    
    // File Upload
    UPLOAD: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    },
    
    // Rate Limiting
    RATE_LIMIT: {
        PUBLIC: { TTL: 60000, LIMIT: 30 },
        AUTH: { TTL: 60000, LIMIT: 10 },
        AUTHENTICATED: { TTL: 60000, LIMIT: 100 },
        ADMIN: { TTL: 60000, LIMIT: 200 },
        SENSITIVE: { TTL: 300000, LIMIT: 5 },
    },
    
    // Pricing
    PRICING: {
        DELIVERY_FEE: 500,
        SERVICE_FEE_PERCENTAGE: 5,
        TAX_PERCENTAGE: 7.5,
    },
    
    // Protein Costs (in Naira)
    PROTEIN_COSTS: {
        FRIED_CHICKEN: 0, // Default, no extra cost
        GRILLED_FISH: 500,
        BEEF: 300,
    },
    
    // Extra Sides Costs
    EXTRA_SIDES_COSTS: {
        FRIED_PLANTAIN: 200,
        COLESLAW: 150,
        EXTRA_PEPPER_SAUCE: 100,
    },
};
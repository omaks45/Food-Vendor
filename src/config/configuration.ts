/* eslint-disable prettier/prettier */
export default () => ({
    port: parseInt(process.env.PORT, 10) || 5000,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    nodeEnv: process.env.NODE_ENV || 'development',

    database: {
        url: process.env.DATABASE_URL,
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },

    redis: {
        url: process.env.REDIS_URL,
    },

    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM,
        fromName: process.env.EMAIL_FROM_NAME || 'Chuks Kitchen',
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'chuks-kitchen',
    },

    oauth: {
        google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        },
        facebook: {
        appId: process.env.FACEBOOK_APP_ID,
        appSecret: process.env.FACEBOOK_APP_SECRET,
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
        },
    },

    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5000',
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5000',
        ],
    },

    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },
});

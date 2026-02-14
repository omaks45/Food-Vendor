/* eslint-disable prettier/prettier */
import * as crypto from 'crypto';

/**
 * Generate a random OTP code
 * @param length Length of OTP (default: 6)
 * @returns Random OTP string
 */
export function generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, digits.length);
        otp += digits[randomIndex];
    }
    
    return otp;
}

/**
 * Generate a unique referral code
 * @returns Unique referral code
 */
export function generateReferralCode(): string {
    const uuid = crypto.randomUUID().replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    return `${uuid.slice(0, 4)}${timestamp}`.toUpperCase();
}

/**
 * Generate slug from string
 * @param text Text to convert to slug
 * @returns Slug string
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Hash refresh token for storage
 * @param token Refresh token
 * @returns Hashed token
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
    page: number,
    limit: number,
    total: number,
    ) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
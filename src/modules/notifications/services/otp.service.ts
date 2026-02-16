/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { AppConstants } from '@/common/constants';
import { generateOTP } from '@/common/utils/helpers';
import { addMinutes } from '@/common/utils/date.utils';

export enum OTPPurpose {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}

@Injectable()
export class OtpService {
    constructor(private prisma: PrismaService) {}

    /**
     * Generate and store OTP
     */
    async generateOTP(userId: string, purpose: OTPPurpose): Promise<string> {
        const code = generateOTP(AppConstants.OTP.LENGTH);
        const expiresAt = addMinutes(new Date(), AppConstants.OTP.EXPIRY_MINUTES);

        await this.prisma.oTPCode.create({
        data: {
            userId,
            code,
            purpose,
            expiresAt,
            isUsed: false,
        },
        });

        return code;
    }

    /**
     * Verify OTP
     */
    async verifyOTP(
        userId: string,
        code: string,
        purpose: OTPPurpose,
    ): Promise<boolean> {
        const otp = await this.prisma.oTPCode.findFirst({
        where: {
            userId,
            code,
            purpose,
            isUsed: false,
        },
        });

        if (!otp) {
        return false;
        }

        if (otp.expiresAt < new Date()) {
        // Mark as used to prevent reuse
        await this.prisma.oTPCode.update({
            where: { id: otp.id },
            data: { isUsed: true },
        });
        return false;
        }

        // Mark OTP as used
        await this.prisma.oTPCode.update({
        where: { id: otp.id },
        data: { isUsed: true },
        });

        return true;
    }

    /**
     * Check if user can request new OTP (rate limiting)
     */
    async canRequestOTP(userId: string, purpose: OTPPurpose): Promise<boolean> {
        const cooldownMinutes = AppConstants.OTP.RESEND_COOLDOWN_MINUTES;
        const cooldownDate = addMinutes(new Date(), -cooldownMinutes);

        const recentOTP = await this.prisma.oTPCode.findFirst({
        where: {
            userId,
            purpose,
            createdAt: {
            gte: cooldownDate,
            },
        },
        });

        return !recentOTP;
    }

    /**
     * Clean up expired OTPs
     */
    async cleanupExpiredOTPs(): Promise<void> {
        await this.prisma.oTPCode.deleteMany({
        where: {
            OR: [
            { expiresAt: { lt: new Date() } },
            { isUsed: true },
            ],
        },
        });
    }
}
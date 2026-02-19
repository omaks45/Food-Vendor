/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { OtpService, OTPPurpose } from './services/otp.service';

@Injectable()
export class NotificationsService {
    constructor(
        private emailService: EmailService,
        private otpService: OtpService,
    ) {}

    // Email methods
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        return this.emailService.sendEmail(to, subject, html);
    }

    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        return this.emailService.sendWelcomeEmail(email, userName);
    }

    async sendOrderConfirmation(
        email: string,
        orderNumber: string,
        orderDetails: any,
    ): Promise<boolean> {
        return this.emailService.sendOrderConfirmation(email, orderNumber, orderDetails);
    }

    // OTP methods
    async generateAndSendOTP(
        userId: string,
        email: string,
        purpose: OTPPurpose,
        userName?: string,
    ): Promise<boolean> {
        const code = await this.otpService.generateOTP(userId, purpose);
        
        if (purpose === OTPPurpose.EMAIL_VERIFICATION) {
        return this.emailService.sendOTP(email, code, userName);
        } else if (purpose === OTPPurpose.PASSWORD_RESET) {
        return this.emailService.sendPasswordResetOTP(email, code);
        }
        
        return false;
    }

    async verifyOTP(
        userId: string,
        code: string,
        purpose: OTPPurpose,
    ): Promise<boolean> {
        return this.otpService.verifyOTP(userId, code, purpose);
    }

    async canRequestOTP(userId: string, purpose: OTPPurpose): Promise<boolean> {
        return this.otpService.canRequestOTP(userId, purpose);
    }
}
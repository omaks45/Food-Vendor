/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST'),
        port: this.configService.get('EMAIL_PORT'),
        secure: this.configService.get('EMAIL_SECURE'),
        auth: {
            user: this.configService.get('EMAIL_USER'),
            pass: this.configService.get('EMAIL_PASSWORD'),
        },
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        html: string,
    ): Promise<boolean> {
        try {
        const from = `${this.configService.get('EMAIL_FROM_NAME')} <${this.configService.get('EMAIL_FROM')}>`;

        await this.transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        this.logger.log(`Email sent to ${to}: ${subject}`);
        return true;
        } catch (error) {
        this.logger.error(`Failed to send email to ${to}`, error);
        return false;
        }
    }

    async sendOTP(email: string, otp: string, userName?: string): Promise<boolean> {
        const subject = 'Verify Your Email - Chuks Kitchen';
        const html = this.getOTPTemplate(otp, userName);

        return this.sendEmail(email, subject, html);
    }

    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        const subject = 'Welcome to Chuks Kitchen!';
        const html = this.getWelcomeTemplate(userName);

        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetOTP(email: string, otp: string): Promise<boolean> {
        const subject = 'Reset Your Password - Chuks Kitchen';
        const html = this.getPasswordResetTemplate(otp);

        return this.sendEmail(email, subject, html);
    }

    async sendOrderConfirmation(
        email: string,
        orderNumber: string,
        orderDetails: any,
    ): Promise<boolean> {
        const subject = `Order Confirmation - ${orderNumber}`;
        const html = this.getOrderConfirmationTemplate(orderNumber, orderDetails);

        return this.sendEmail(email, subject, html);
    }

    private getOTPTemplate(otp: string, userName?: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">Verify Your Email</h2>
            
            ${userName ? `<p>Hello ${userName},</p>` : '<p>Hello,</p>'}
            
            <p>Thank you for registering with Chuks Kitchen. Please use the following code to verify your email address:</p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                <h1 style="color: #e74c3c; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            
            <p>This code will expire in 10 minutes.</p>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Chuks Kitchen. All rights reserved.
            </p>
            </div>
        </body>
        </html>
        `;
    }

    private getWelcomeTemplate(userName: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Chuks Kitchen</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">Welcome to Chuks Kitchen!</h2>
            
            <p>Hello ${userName},</p>
            
            <p>Your email has been successfully verified. Welcome to Chuks Kitchen – your gateway to delicious Nigerian cuisine!</p>
            
            <h3 style="color: #e74c3c;">What's Next?</h3>
            <ul>
                <li>Browse our menu and discover amazing dishes</li>
                <li>Place your first order and enjoy fast delivery</li>
                <li>Track your orders in real-time</li>
                <li>Earn rewards with our referral program</li>
            </ul>
            
            <p>We're excited to serve you!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Chuks Kitchen. All rights reserved.
            </p>
            </div>
        </body>
        </html>
        `;
    }

    private getPasswordResetTemplate(otp: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p>You requested to reset your password. Use the code below to proceed:</p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                <h1 style="color: #e74c3c; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            
            <p>This code will expire in 10 minutes.</p>
            
            <p><strong>If you didn't request this,</strong> please ignore this email and your password will remain unchanged.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Chuks Kitchen. All rights reserved.
            </p>
            </div>
        </body>
        </html>
        `;
    }

    private getOrderConfirmationTemplate(orderNumber: string, orderDetails: any): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">Order Confirmed!</h2>
            
            <p>Thank you for your order!</p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order #${orderNumber}</h3>
                <p><strong>Total:</strong> ₦${orderDetails.total?.toLocaleString()}</p>
                <p><strong>Estimated Delivery:</strong> ${orderDetails.deliveryTime || 'TBD'}</p>
            </div>
            
            <p>We're preparing your delicious meal and it will be delivered soon!</p>
            
            <p>You can track your order status in your account.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Chuks Kitchen. All rights reserved.
            </p>
            </div>
        </body>
        </html>
        `;
    }
}
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';

@Module({
    imports: [ConfigModule],
    providers: [NotificationsService, EmailService, OtpService],
    exports: [NotificationsService, EmailService, OtpService],
})
export class NotificationsModule {}
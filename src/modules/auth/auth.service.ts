/* eslint-disable prettier/prettier */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AppConstants, ErrorCodes } from '@/common/constants';
import { generateReferralCode, hashToken } from '@/common/utils/helpers';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { OTPPurpose } from '../notifications/services/otp.service';
import { UserRole } from '@/common/enums';
//import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, phoneNumber, password, firstName, lastName, confirmPassword, referralCode } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phoneNumber ? [{ phoneNumber }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new ConflictException({
          code: ErrorCodes.EMAIL_ALREADY_EXISTS,
          message: 'User with this email already exists',
        });
      }

      // If user exists but not verified, and registration is > 24h old, delete old account
      const hoursSinceRegistration =
        (Date.now() - existingUser.createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceRegistration > 24) {
        await this.prisma.user.delete({ where: { id: existingUser.id } });
      } else {
        throw new BadRequestException({
          code: ErrorCodes.EMAIL_NOT_VERIFIED,
          message:
            'Please check your email for verification code or request a new one',
        });
      }
    }

    // NEW CODE (checks both user referrals AND promo codes)
    let referrerId: string | null = null;

    if (referralCode) {
      // First, check if it's a user's referral code
      const referringUser = await this.prisma.user.findFirst({
        where: { referralCode },
      });

      if (referringUser) {
        referrerId = referringUser.id;
      } else {
        // If not a user code, check if it's a promotional code
        const promoCode = await this.prisma.referralCode.findFirst({
          where: {
            code: referralCode,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        });

        if (!promoCode) {
          throw new BadRequestException({
            code: ErrorCodes.INVALID_REFERRAL_CODE,
            message: 'Invalid or expired referral code',
          });
        }

        // Check usage limits for promo codes
        if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
          throw new BadRequestException({
            code: ErrorCodes.REFERRAL_CODE_MAX_USES,
            message: 'Referral code has reached maximum uses',
          });
        }

        referrerId = promoCode.userId; // May be null for system promo codes
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      AppConstants.PASSWORD.SALT_ROUNDS,
    );

    // Generate unique referral code for new user
    const newUserReferralCode = generateReferralCode();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        phoneNumber: phoneNumber || null,
        password: hashedPassword, // Only save the hashed password
        firstName,
        lastName,
        referralCode: newUserReferralCode,
        referredBy: referrerId,
      },
    });
    // Generate and send OTP
    await this.notificationsService.generateAndSendOTP(
      user.id,
      user.email,
      OTPPurpose.EMAIL_VERIFICATION,
      user.firstName,
    );

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        email: user.email,
        requiresVerification: true,
      },
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'Email already verified',
      });
    }

    // Verify OTP
    const isValid = await this.notificationsService.verifyOTP(
      user.id,
      code,
      OTPPurpose.EMAIL_VERIFICATION,
    );

    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_OTP,
        message: 'Invalid or expired OTP',
      });
    }

    // Update user and increment referral code usage in transaction
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update user
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          lastLogin: new Date(),
        },
        include: {
          referrer: {
            select: {
              referralCode: true,
            },
          },
        },
      });

      // Increment referral code usage if user was referred
      if (updated.referredBy) {
        await tx.referralCode.updateMany({
          where: {
            userId: updated.referredBy,
            isActive: true,
          },
          data: {
            currentUses: { increment: 1 },
          },
        });
      }

      return updated;
    });

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail(
      user.email,
      user.firstName,
    );

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        user: this.sanitizeUser(updatedUser),
        tokens,
      },
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        code: ErrorCodes.EMAIL_NOT_VERIFIED,
        message: 'Please verify your email before logging in',
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user),
        tokens,
      },
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'Email already verified',
      });
    }

    // Check rate limiting
    const canRequest = await this.notificationsService.canRequestOTP(
      user.id,
      OTPPurpose.EMAIL_VERIFICATION,
    );

    if (!canRequest) {
      throw new BadRequestException({
        code: ErrorCodes.TOO_MANY_OTP_REQUESTS,
        message: `Please wait ${AppConstants.OTP.RESEND_COOLDOWN_MINUTES} minutes before requesting another OTP`,
      });
    }

    // Generate and send new OTP
    await this.notificationsService.generateAndSendOTP(
      user.id,
      user.email,
      OTPPurpose.EMAIL_VERIFICATION,
      user.firstName,
    );

    return {
      success: true,
      message: 'OTP sent successfully',
      data: {
        email: user.email,
      },
    };
  }

  /**
   * Forgot password - send OTP
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If the email exists, a reset code has been sent',
        data: null,
      };
    }

    // Check rate limiting
    const canRequest = await this.notificationsService.canRequestOTP(
      user.id,
      OTPPurpose.PASSWORD_RESET,
    );

    if (!canRequest) {
      throw new BadRequestException({
        code: ErrorCodes.TOO_MANY_OTP_REQUESTS,
        message: 'Please wait before requesting another reset code',
      });
    }

    // Generate and send OTP
    await this.notificationsService.generateAndSendOTP(
      user.id,
      user.email,
      OTPPurpose.PASSWORD_RESET,
    );

    return {
      success: true,
      message: 'If the email exists, a reset code has been sent',
      data: null,
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    // Verify OTP
    const isValid = await this.notificationsService.verifyOTP(
      user.id,
      code,
      OTPPurpose.PASSWORD_RESET,
    );

    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_OTP,
        message: 'Invalid or expired OTP',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      AppConstants.PASSWORD.SALT_ROUNDS,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.redisService.delete(`refresh_token:${user.id}`);

    return {
      success: true,
      message: 'Password reset successfully',
      data: null,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const storedTokenHash = await this.redisService.get(
        `refresh_token:${payload.sub}`,
      );

      if (!storedTokenHash) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Verify token hash
      const tokenHash = hashToken(refreshToken);
      if (tokenHash !== storedTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      // Store new refresh token
      await this.storeRefreshToken(payload.sub, tokens.refreshToken);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      };
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_TOKEN,
        message: 'Invalid or expired refresh token',
      });
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    await this.redisService.delete(`refresh_token:${userId}`);

    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, email: string, role: UserRole, ) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    await this.redisService.set(`refresh_token:${userId}`, tokenHash, ttl);
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...sanitized } = user;
  return sanitized;
}
}
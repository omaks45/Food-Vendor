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
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // PUBLIC: User Auth
  // ---------------------------------------------------------------------------

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const { email, phoneNumber, password, firstName, lastName, referralCode } = registerDto;

    await this.assertEmailAvailable(email);

    // Resolve referrer (user referral code OR promo code)
    let referrerId: string | null = null;

    if (referralCode) {
      const referringUser = await this.prisma.user.findFirst({
        where: { referralCode },
      });

      if (referringUser) {
        referrerId = referringUser.id;
      } else {
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

        if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
          throw new BadRequestException({
            code: ErrorCodes.REFERRAL_CODE_MAX_USES,
            message: 'Referral code has reached maximum uses',
          });
        }

        referrerId = promoCode.userId;
      }
    }

    const hashedPassword = await this.hashPassword(password);
    const newUserReferralCode = await this.generateUniqueReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email,
        phoneNumber: phoneNumber || null,
        password: hashedPassword,
        firstName,
        lastName,
        referralCode: newUserReferralCode,
        referredBy: referrerId,
      },
    });

    await this.notificationsService.generateAndSendOTP(
      user.id,
      user.email,
      OTPPurpose.EMAIL_VERIFICATION,
      user.firstName,
    );

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { email: user.email, requiresVerification: true },
    };
  }

  /**
   * Register a new admin user
   */
  async registerAdmin(adminRegisterDto: AdminRegisterDto) {
    const { email, password, firstName, lastName, adminSecret } = adminRegisterDto;

    this.assertValidAdminSecret(adminSecret);
    await this.assertEmailAvailable(email);

    const hashedPassword = await this.hashPassword(password);
    const adminReferralCode = await this.generateUniqueReferralCode();

    const admin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.ADMIN,
        referralCode: adminReferralCode,
        isEmailVerified: false,
        isPhoneVerified: false,
      },
    });

    await this.notificationsService.generateAndSendOTP(
      admin.id,
      admin.email,
      OTPPurpose.EMAIL_VERIFICATION,
      admin.firstName,
    );

    return {
      success: true,
      message: 'Admin registration successful. Please verify your email.',
      data: { email: admin.email, role: admin.role, requiresVerification: true },
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    const user = await this.findUserByEmailOrFail(email);

    if (user.isEmailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'Email already verified',
      });
    }

    await this.verifyOtpOrFail(user.id, code, OTPPurpose.EMAIL_VERIFICATION);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, lastLogin: new Date() },
        include: { referrer: { select: { referralCode: true } } },
      });

      if (updated.referredBy) {
        await tx.referralCode.updateMany({
          where: { userId: updated.referredBy, isActive: true },
          data: { currentUses: { increment: 1 } },
        });
      }

      return updated;
    });

    await this.notificationsService.sendWelcomeEmail(user.email, user.firstName);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Email verified successfully',
      data: { user: this.sanitizeUser(updatedUser), tokens },
    };
  }

  /**
   * Login a regular user (CUSTOMER only)
   * SECURITY: Prevents admins from logging in through customer endpoint
   */
  async login(loginDto: LoginDto) {
    const user = await this.authenticateUser(
      loginDto.email, 
      loginDto.password, 
      UserRole.CUSTOMER  // ENFORCES CUSTOMER ROLE
    );
    return this.buildLoginResponse(user, 'Login successful');
  }

  /**
   * Login an admin user (ADMIN only)
   * SECURITY: Prevents customers from logging in through admin endpoint
   */
  async loginAdmin(adminLoginDto: AdminLoginDto) {
    const admin = await this.authenticateUser(
      adminLoginDto.email, 
      adminLoginDto.password, 
      UserRole.ADMIN  //ENFORCES ADMIN ROLE
    );
    return this.buildLoginResponse(admin, 'Admin login successful');
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string) {
    const user = await this.findUserByEmailOrFail(email);

    if (user.isEmailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'Email already verified',
      });
    }

    await this.assertOtpRateLimitOrFail(user.id, OTPPurpose.EMAIL_VERIFICATION);

    await this.notificationsService.generateAndSendOTP(
      user.id,
      user.email,
      OTPPurpose.EMAIL_VERIFICATION,
      user.firstName,
    );

    return {
      success: true,
      message: 'OTP sent successfully',
      data: { email: user.email },
    };
  }

  /**
   * Forgot password — send OTP
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Avoid revealing whether the email exists
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a reset code has been sent',
        data: null,
      };
    }

    await this.assertOtpRateLimitOrFail(user.id, OTPPurpose.PASSWORD_RESET);

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

    const user = await this.findUserByEmailOrFail(email);

    await this.verifyOtpOrFail(user.id, code, OTPPurpose.PASSWORD_RESET);

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions
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

      const storedTokenHash = await this.redisService.get(`refresh_token:${payload.sub}`);

      if (!storedTokenHash) {
        throw new UnauthorizedException('Refresh token not found');
      }

      if (hashToken(refreshToken) !== storedTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);
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
    return { success: true, message: 'Logged out successfully', data: null };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Shared Auth Logic
  // ---------------------------------------------------------------------------

  /**
   * Locate + validate credentials for both user and admin login paths.
   * UPDATED: Now REQUIRES role parameter for strict enforcement
   * 
   * @param email - User email
   * @param password - User password
   * @param requiredRole - REQUIRED role (CUSTOMER or ADMIN)
   */
  private async authenticateUser(email: string, password: string, requiredRole: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Unified "invalid credentials" — don't leak whether the account exists
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // STRICT ROLE ENFORCEMENT - Now mandatory
    if (user.role !== requiredRole) {
      // Different messages based on attempted access
      const errorMessage = requiredRole === UserRole.ADMIN
        ? 'Access denied. Admin credentials required.'
        : 'Access denied. Please use the customer login.';
      
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: errorMessage,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        code: ErrorCodes.EMAIL_NOT_VERIFIED,
        message: 'Please verify your email before logging in',
      });
    }

    return user;
  }

  /**
   * Finalise a successful login: stamp lastLogin, generate tokens, build response.
   * Used by both `login` and `loginAdmin`.
   */
  private async buildLoginResponse(user: any, message: string) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message,
      data: { user: this.sanitizeUser(user), tokens },
    };
  }

  /**
   * Check whether an email is free to register.
   * Handles the "unverified stale account" cleanup shared by register + registerAdmin.
   */
  private async assertEmailAvailable(email: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (!existingUser) return;

    if (existingUser.isEmailVerified) {
      throw new ConflictException({
        code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    const hoursSinceRegistration =
      (Date.now() - existingUser.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRegistration > 24) {
      await this.prisma.user.delete({ where: { id: existingUser.id } });
    } else {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_NOT_VERIFIED,
        message: 'Please check your email for verification code or request a new one',
      });
    }
  }

  /**
   * Validate admin secret from config — throws if missing or mismatched.
   */
  private assertValidAdminSecret(adminSecret: string) {
    const expectedAdminSecret = this.configService.get('ADMIN_SECRET');

    if (!expectedAdminSecret) {
      throw new ConflictException({
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Admin registration is not configured',
      });
    }

    if (adminSecret !== expectedAdminSecret) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid admin secret key',
      });
    }
  }

  /**
   * Find a user by email or throw NotFoundException.
   */
  private async findUserByEmailOrFail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return user;
  }

  /**
   * Verify an OTP or throw UnauthorizedException.
   */
  private async verifyOtpOrFail(userId: string, code: string, purpose: OTPPurpose) {
    const isValid = await this.notificationsService.verifyOTP(userId, code, purpose);

    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_OTP,
        message: 'Invalid or expired OTP',
      });
    }
  }

  /**
   * Assert OTP rate limit has not been exceeded or throw BadRequestException.
   */
  private async assertOtpRateLimitOrFail(userId: string, purpose: OTPPurpose) {
    const canRequest = await this.notificationsService.canRequestOTP(userId, purpose);

    if (!canRequest) {
      throw new BadRequestException({
        code: ErrorCodes.TOO_MANY_OTP_REQUESTS,
        message: `Please wait ${AppConstants.OTP.RESEND_COOLDOWN_MINUTES} minutes before requesting another OTP`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Token & Crypto Helpers
  // ---------------------------------------------------------------------------

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const accessPayload: JwtPayload = { sub: userId, email, role, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, role, type: 'refresh' };

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

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redisService.set(`refresh_token:${userId}`, tokenHash, ttl);
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, AppConstants.PASSWORD.SALT_ROUNDS);
  }

  /**
   * Loop until a referral code not already in use is found.
   * Used by both register (user) and registerAdmin.
   */
  private async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = generateReferralCode();
      const user = await this.prisma.user.findUnique({ where: { referralCode: code } });
      exists = !!user;
    }

    return code;
  }

  private sanitizeUser(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...sanitized } = user;
    return sanitized;
  }
}
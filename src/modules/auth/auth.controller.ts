/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  //Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  RegisterResponseDto,
  AuthResponseDto,
} from './dto/auth-response.dto';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AppConstants } from '@/common/constants';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({
    default: AppConstants.RATE_LIMIT.AUTH,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Email verification required.',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  
  /**
   * Admin Registration
   */
  @Post('admin/register')
  @ApiTags('Admin Authentication')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid admin secret key',
  })
  async registerAdmin(
    @Body() adminRegisterDto: AdminRegisterDto,
  ): Promise<any> {
    return this.authService.registerAdmin(adminRegisterDto);
  }

  /**
   * Admin Login
   */
  @Post('admin/login')
  @ApiTags('Admin Authentication')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({
    status: 200,
    description: 'Admin logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or not an admin',
  })
  async loginAdmin(@Body() adminLoginDto: AdminLoginDto): Promise<any> {
    return this.authService.loginAdmin(adminLoginDto);
  }


  @Public()
  @Post('verify-email')
  @Throttle({ default: AppConstants.RATE_LIMIT.AUTH })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('resend-otp')
  @Throttle({ default: AppConstants.RATE_LIMIT.SENSITIVE })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Too many requests' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.email);
  }

  @Public()
  @Post('login')
  @Throttle({ default: AppConstants.RATE_LIMIT.AUTH })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: AppConstants.RATE_LIMIT.SENSITIVE })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'Reset code sent if email exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: AppConstants.RATE_LIMIT.AUTH })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('refresh-token')
  @Throttle({ default: AppConstants.RATE_LIMIT.AUTH })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser('userId') userId: string) {
    // This will be implemented in UsersService
    return {
      success: true,
      message: 'User data retrieved',
      data: { userId }, // Placeholder
    };
  }
}
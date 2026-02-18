/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AppConstants, ErrorCodes } from '@/common/constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: true,
        profileImage: true,
        referralCode: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            addresses: true,
            orders: true,
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { phoneNumber, ...otherUpdates } = updateProfileDto;

    // Check if phone number is being updated and already exists
    if (phoneNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phoneNumber,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestException({
          code: ErrorCodes.PHONE_ALREADY_EXISTS,
          message: 'Phone number already in use',
        });
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...otherUpdates,
        ...(phoneNumber && { phoneNumber, isPhoneVerified: false }),
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.PASSWORD_MISMATCH,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      AppConstants.PASSWORD.SALT_ROUNDS,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully',
      data: null,
    };
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      message: 'Addresses retrieved successfully',
      data: addresses,
    };
  }

  /**
   * Create address
   */
  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    const { isDefault, ...addressData } = createAddressDto;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        ...addressData,
        userId,
        isDefault: isDefault ?? false,
      },
    });

    return {
      success: true,
      message: 'Address created successfully',
      data: address,
    };
  }

  /**
   * Update address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    // Verify address belongs to user
    const existingAddress = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new NotFoundException({
        code: ErrorCodes.INVALID_ADDRESS,
        message: 'Address not found',
      });
    }

    const { isDefault, ...addressData } = updateAddressDto;

    // If setting as default, unset other defaults
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...addressData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return {
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress,
    };
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string) {
    // Verify address belongs to user
    const existingAddress = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new NotFoundException({
        code: ErrorCodes.INVALID_ADDRESS,
        message: 'Address not found',
      });
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return {
      success: true,
      message: 'Address deleted successfully',
      data: null,
    };
  }

  /**
   * Get user's referral code and stats
   */
  async getReferralInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      success: true,
      message: 'Referral info retrieved successfully',
      data: {
        referralCode: user.referralCode,
        totalReferrals: user._count.referrals,
      },
    };
  }
}
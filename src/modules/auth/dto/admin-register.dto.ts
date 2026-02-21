/* eslint-disable prettier/prettier */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Match } from '@/common/decorators/match.decorator';

export class AdminRegisterDto {
    @ApiProperty({ example: 'admin@chukskitchen.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'Admin' })
    @IsString()
    @MinLength(2, { message: 'First name must be at least 2 characters' })
    @MaxLength(50, { message: 'First name must not exceed 50 characters' })
    firstName: string;

    @ApiProperty({ example: 'User' })
    @IsString()
    @MinLength(2, { message: 'Last name must be at least 2 characters' })
    @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
    lastName: string;

    @ApiProperty({ example: 'AdminPassword123!', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
        'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;

    @ApiProperty({ example: 'AdminPassword123!' })
    @IsString()
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;

    @ApiProperty({
        example: 'your-admin-secret-key',
        description: 'Admin secret key for registration authorization',
    })
    @IsString()
    @MinLength(1, { message: 'Admin secret is required' })
    adminSecret: string;
}
/* eslint-disable prettier/prettier */
import { Match } from '@/common/decorators/match.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
    //IsEnum,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiPropertyOptional({ example: '+2348012345678' })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Please provide a valid phone number',
    })
    phoneNumber?: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    @MinLength(2, { message: 'First name must be at least 2 characters' })
    @MaxLength(50, { message: 'First name must not exceed 50 characters' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @MinLength(2, { message: 'Last name must be at least 2 characters' })
    @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
    lastName: string;

    @ApiProperty({ example: 'Password123!', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
        'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;

    @ApiPropertyOptional({ example: 'REF123ABC' })
    @IsOptional()
    @IsString()
    referralCode?: string;
}
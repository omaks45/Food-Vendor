/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
    code: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
        'Password must contain uppercase, lowercase, number, and special character',
    })
    newPassword: string;
}
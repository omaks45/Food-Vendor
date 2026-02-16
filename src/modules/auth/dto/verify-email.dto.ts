/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
    @IsString()
    @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
    code: string;
}
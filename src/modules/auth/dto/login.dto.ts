/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @MinLength(1, { message: 'Password is required' })
    password: string;
}
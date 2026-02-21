/* eslint-disable prettier/prettier */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
    @ApiProperty({ example: 'admin@chukskitchen.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'AdminPassword123!' })
    @IsString()
    @MinLength(1, { message: 'Password is required' })
    password: string;
}
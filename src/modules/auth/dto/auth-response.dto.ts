/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refreshToken: string;
    }

export class UserResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    id: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'CUSTOMER' })
    role: string;

    @ApiProperty({ example: true })
    isEmailVerified: boolean;

    @ApiProperty({ example: 'REF123ABC' })
    referralCode: string;
}

export class AuthResponseDto {
    @ApiProperty()
    user: UserResponseDto;

    @ApiProperty()
    tokens: AuthTokensDto;
}

export class RegisterResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Registration successful. Please verify your email.' })
    message: string;

    @ApiProperty()
    data: {
        email: string;
        requiresVerification: boolean;
    };
}
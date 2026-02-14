/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    data?: T;

    @ApiProperty()
    metadata?: {
        timestamp: string;
        version: string;
    };
}

export class ErrorResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    error: {
        code: string;
        details?: any;
    };

    @ApiProperty()
    metadata: {
        timestamp: string;
        version: string;
    };
}

export class PaginatedResponseDto<T = any> {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    data: T[];

    @ApiProperty()
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
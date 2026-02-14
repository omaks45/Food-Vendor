/* eslint-disable prettier/prettier */

export class SuccessResponseDto<T = any> {
    success: boolean;
    message: string;
    data?: T;
    metadata?: {
        timestamp: string;
        version: string;
    };
}

export class ErrorResponseDto {
    success: boolean;
    message: string;
    error: {
        code: string;
        details?: any;
    };
    metadata: {
        timestamp: string;
        version: string;
    };
}

export class PaginatedResponseDto<T = any> {
    success: boolean;
    message: string;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
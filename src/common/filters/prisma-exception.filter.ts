/* eslint-disable prettier/prettier */
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

/**
 * PrismaExceptionFilter is a global exception filter that catches specific Prisma exceptions
 * and transforms them into standardized HTTP responses. It handles common database errors
 * such as unique constraint violations, record not found, and foreign key constraint failures. 
 * The filter extracts relevant information from the Prisma exceptions and formats it into a consistent response structure, including an error code, message, and metadata. This allows the application to provide clear and actionable error messages to clients while maintaining a clean separation of concerns between database logic and error handling.
 * To use this filter, simply add it to the providers array in your main application module or any specific module where you want to handle Prisma exceptions globally.
 */

@Catch(PrismaClientValidationError, PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error occurred';
        let code = 'DB_ERROR';

        switch (exception.code) {
            case 'P2002':
                status = HttpStatus.CONFLICT;
                message = `Duplicate field value: ${exception.meta?.target}`;
                code = 'DUPLICATE_FIELD';
                break;
            case 'P2025':
                status = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                code = 'NOT_FOUND';
                break;
            case 'P2003':
                status = HttpStatus.BAD_REQUEST;
                message = 'Foreign key constraint failed';
                code = 'FOREIGN_KEY_ERROR';
                break;
            default:
                message = exception.message;
        }

        response.status(status).json({
            success: false,
            message,
            error: {
                code,
                details: exception.meta,
            },
            metadata: {
                timestamp: new Date().toISOString(),
                version: 'v1',
            },
            });
        }
}
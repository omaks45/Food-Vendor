/* eslint-disable prettier/prettier */
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    //HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const errorResponse = {
        success: false,
        message:
            typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'An error occurred',
        error: {
            code: `HTTP_${status}`,
            details:
            typeof exceptionResponse === 'object'
                ? (exceptionResponse as any).error
                : null,
        },
        metadata: {
            timestamp: new Date().toISOString(),
            version: 'v1',
        },
        };

        response.status(status).json(errorResponse);
    }
}
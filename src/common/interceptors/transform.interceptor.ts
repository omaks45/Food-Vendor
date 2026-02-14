/* eslint-disable prettier/prettier */
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    message: string;
    data: T;
    metadata: {
        timestamp: string;
        version: string;
    };
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
    {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
        map((data) => {
            // If response already has success field, return as is
            if (data && typeof data === 'object' && 'success' in data) {
            return data;
            }

            // Otherwise wrap in standard format
            return {
            success: true,
            message: data?.message || 'Operation successful',
            data: data?.data || data,
            metadata: {
                timestamp: new Date().toISOString(),
                version: 'v1',
            },
            };
        }),
        );
    }
}
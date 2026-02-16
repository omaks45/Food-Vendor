/* eslint-disable prettier/prettier */
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis provider with retry logic and error handling
 * This provider will be used to inject the Redis client throughout the application
 * It includes retry strategies for connection issues and handles specific Redis errors gracefully
 * The provider uses the ConfigService to get the Redis connection URL from environment variables
 * The retry strategy implements exponential backoff to avoid overwhelming the Redis server during connection issues
 * The reconnectOnError function allows the client to attempt reconnection on specific errors, such as READONLY errors in Redis Cluster mode
 */

export const redisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('Redis_URL');
        
        const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError(err) {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
            return true;
            }
            return false;
        },
        });

        client.on('connect', () => {
        console.log('Redis connected successfully');
        });

        client.on('error', (error) => {
        console.error('Redis connection error:', error);
        });

        return client;
    },
    inject: [ConfigService],
};
/* eslint-disable prettier/prettier */
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';


/**
 * RedisService is a wrapper around the ioredis client that provides common Redis operations with built-in error handling and logging. It abstracts away the direct interaction with the Redis client and offers methods for getting, setting, deleting keys, and more. The service includes retry logic for connection issues and logs any errors that occur during Redis operations, making it easier to maintain and debug Redis interactions within the application. By using this service, other parts of the application can interact with Redis in a consistent and reliable manner without needing to manage the underlying client directly.
 * To use this service, simply inject it into your controllers or other services where you need to interact with Redis. The service will handle all Redis operations and ensure that any errors are logged appropriately.
 */

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    ) {}

    /**
     * Get value from Redis
     */
    async get<T = any>(key: string): Promise<T | null> {
        try {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
        } catch (error) {
        this.logger.error(`Redis GET error for key: ${key}`, error);
        return null;
        }
    }

    /**
     * Set value in Redis with TTL
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        try {
        const serialized = JSON.stringify(value);
        
        if (ttlSeconds) {
            await this.redisClient.setex(key, ttlSeconds, serialized);
        } else {
            await this.redisClient.set(key, serialized);
        }
        
        return true;
        } catch (error) {
        this.logger.error(`Redis SET error for key: ${key}`, error);
        return false;
        }
    }

    /**
     * Delete key from Redis
     */
    async delete(key: string): Promise<boolean> {
        try {
        await this.redisClient.del(key);
        return true;
        } catch (error) {
        this.logger.error(`Redis DELETE error for key: ${key}`, error);
        return false;
        }
    }

    /**
     * Delete multiple keys matching pattern
     */
    async deletePattern(pattern: string): Promise<boolean> {
        try {
        const keys = await this.redisClient.keys(pattern);
        
        if (keys.length > 0) {
            await this.redisClient.del(...keys);
        }
        
        return true;
        } catch (error) {
        this.logger.error(`Redis DELETE PATTERN error for: ${pattern}`, error);
        return false;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
        const result = await this.redisClient.exists(key);
        return result === 1;
        } catch (error) {
        this.logger.error(`Redis EXISTS error for key: ${key}`, error);
        return false;
        }
    }

    /**
     * Increment value
     */
    async increment(key: string, by: number = 1): Promise<number> {
        try {
        return await this.redisClient.incrby(key, by);
        } catch (error) {
        this.logger.error(`Redis INCREMENT error for key: ${key}`, error);
        throw error;
        }
    }

    /**
     * Set expiry on key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        try {
        const result = await this.redisClient.expire(key, seconds);
        return result === 1;
        } catch (error) {
        this.logger.error(`Redis EXPIRE error for key: ${key}`, error);
        return false;
        }
    }

    /**
     * Get TTL of key
     */
    async ttl(key: string): Promise<number> {
        try {
        return await this.redisClient.ttl(key);
        } catch (error) {
        this.logger.error(`Redis TTL error for key: ${key}`, error);
        return -1;
        }
    }
}
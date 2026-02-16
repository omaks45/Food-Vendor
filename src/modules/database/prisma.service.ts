/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super();
        
        // Configure logging separately (optional)
        this.$on('error', (e) => {
            this.logger.error('Prisma error:', e);
        });
        
        this.$on('warn', (e) => {
            this.logger.warn('Prisma warning:', e);
        });
        }

    async onModuleInit() {
        let retries = 5;
        
        while (retries > 0) {
        try {
            await this.$connect();
            this.logger.log('Database connected successfully');
            return;
        } catch (error) {
            retries -= 1;
            this.logger.error(
            `Database connection failed. Retries left: ${retries}`,
            error,
            );
            
            if (retries === 0) {
            throw error;
            }
            
            // Exponential backoff
            await new Promise((resolve) =>
            setTimeout(resolve, (5 - retries) * 1000),
            );
        }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }

    /**
     * Execute operation with retry logic
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
    ): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
            throw error;
            }
            
            this.logger.warn(
            `Operation failed, retrying... (${attempt}/${maxRetries})`,
            );
            
            // Exponential backoff: 2^attempt * 100ms
            const delay = Math.pow(2, attempt) * 100;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        }
    }

    /**
     * Clean up disconnected clients
     */
    async cleanUp(): Promise<void> {
        await this.$disconnect();
    }
}
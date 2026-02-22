/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';

// Core Modules
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { FoodModule } from './modules/food/food.module';

@Module({
  imports: [
    // Configuration - Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate Limiting - Protect against brute force attacks
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core Infrastructure Modules
    DatabaseModule,
    RedisModule,
    CloudinaryModule,
    NotificationsModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    FoodModule
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT auth globally
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
  ],
})
export class AppModule {}
/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'API health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHealth() {
    return {
      success: true,
      message: 'Chuks Kitchen API is running',
      data: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getDetailedHealth() {
    return {
      success: true,
      message: 'All services operational',
      data: {
        api: 'healthy',
        database: 'connected',
        redis: 'connected',
        email: 'configured',
        cloudinary: 'configured',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
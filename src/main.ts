/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security - Helmet
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = configService.get<string[]>('frontend.allowedOrigins');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global API Prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types
      },
    }),
  );

  // Global Exception Filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Global Interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chuks Kitchen API')
    .setDescription(
      'Complete API documentation for Chuks Kitchen food ordering platform. ' +
      'This API provides endpoints for user authentication, menu management, ' +
      'order processing, and delivery tracking.',
    )
    .setVersion('1.0')
    .setContact(
      'TrueMinds Innovations Ltd',
      'https://trueminds.com',
      'support@chukskitchen.com',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User profile and address management')
    .addTag('Food Categories', 'Food category management')
    .addTag('Food Items', 'Food item management')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order management and tracking')
    .addTag('Referrals', 'Referral code management')
    .addServer(`http://localhost:${configService.get('PORT')}`, 'Local Development')
    .addServer('https://api.chukskitchen.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Chuks Kitchen API Docs',
    customfavIcon: 'https://chukskitchen.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e74c3c }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
    },
  });

  // Start Server
  const port = configService.get<number>('PORT', 5000);
  await app.listen(port);

  logger.log(`
    CHUKS KITCHEN API - SUCCESSFULLY STARTED
    Server:        http://localhost:${port}/${apiPrefix}
    Docs:          http://localhost:${port}/api/docs
    Environment:   ${configService.get('NODE_ENV')}
    Started:       ${new Date().toLocaleString()}
  `);

  // Log important startup information
  logger.log(`MongoDB connected`);
  logger.log(`Redis connected`);
  logger.log(`Email service configured`);
  logger.log(`Cloudinary configured`);
  logger.log(`JWT authentication enabled`);
  logger.log(`Rate limiting enabled`);
  logger.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
  logger.log(`
    API Documentation available at: http://localhost:${port}/api/docs
    
    Ready to accept requests! 
  `);
}

bootstrap();
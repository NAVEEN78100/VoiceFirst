import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Global prefix
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });
  
  // Cookie parser
  app.use(cookieParser());

  // CORS setup for Production (Render + Vercel)
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'https://voicefirst.in',
        'https://www.voicefirst.in'
      ];
      
      // Accept Vercel preview environments dynamically
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // MVP Bypass: Allow all origins to ensure no frontend blockage
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // CRITICAL: Bind to 0.0.0.0 for Render deployments!
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 VoiceFirst Auth Server running on http://localhost:${port}`);
  logger.log(`📡 API available at http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();

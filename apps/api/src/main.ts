import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // === SEGURIDAD: Helmet (headers HTTP de protección) ===
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.setGlobalPrefix('api');

  // === CORS: Whitelist de dominios ===
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin 
    ? corsOrigin.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman o apps móviles)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // === VALIDACIÓN: Whitelist estricto ===
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Elimina campos no declarados en DTOs
      forbidNonWhitelisted: true,   // Rechaza con error 400 si mandan campos extra
      transform: true,              // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // === SWAGGER: Solo en desarrollo ===
  const nodeEnv = configService.get<string>('NODE_ENV');
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Suite Educativa API')
      .setDescription('API principal de la Suite Educativa')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') || 4000;

  await app.listen(port);
  console.log(`🚀 API lista en http://localhost:${port}/api`);
  if (nodeEnv !== 'production') {
    console.log(`📚 Swagger en http://localhost:${port}/api/docs`);
  }
  console.log(`🔒 Seguridad: Helmet activado, CORS restrictivo, Rate limiting activo`);
}

bootstrap();
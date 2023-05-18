import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  //Create an instance of the Nest application using the NestFactory.create method, passing the AppModule as the root module of the application. The cors: true option enables Cross-Origin Resource Sharing (CORS) for the application.
  const app = await NestFactory.create(AppModule, { cors: true });

  // Use the useContainer function from class-validator to set up dependency injection using the class-validator container.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  //Retrieve the configuration service by calling app.get(ConfigService<AllConfigType>). This service is responsible for providing access to configuration values defined in the application's environment.
  const configService = app.get(ConfigService<AllConfigType>);

  //Enable shutdown hooks by calling app.enableShutdownHooks(). This allows the application to gracefully handle termination signals.
  app.enableShutdownHooks();

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();

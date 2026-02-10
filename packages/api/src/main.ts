import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import {AppModule} from './app.module';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}));
  await app.listen(PORT);
  console.log(`Server running at http://localhost:${PORT}/graphql`);
}

bootstrap();

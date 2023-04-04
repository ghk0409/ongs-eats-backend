import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { jwtMiddleware } from './jwt/jwt.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // validation pipeline
    app.useGlobalPipes(new ValidationPipe());
    // middleware 적용 (App global 적용)
    app.use(jwtMiddleware);

    await app.listen(3000);
}
bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { jwtMiddleware } from './jwt/jwt.middleware';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // validation pipeline
    app.useGlobalPipes(new ValidationPipe());
    // middleware 적용 (App global 적용)
    // app.use(jwtMiddleware);

    await app.listen(3000);

    // hot reload (수정된 파일만 recompile 진행)
    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}
bootstrap();

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [UsersModule],
    // auth guard를 전역으로 설정
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AuthModule {}

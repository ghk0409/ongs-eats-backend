import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UsersResolver, UsersService],
    // 다른 모듈에서 UsersModule 내에 접근할 수 있도록 exports 설정 (UsersService 내보내기)
    exports: [UsersService],
})
export class UsersModule {}

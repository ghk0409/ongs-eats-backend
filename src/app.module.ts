import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { join } from 'path';
import { RestaurantsModule } from './restaurants/restaurants.module';
import * as Joi from 'joi';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath:
                process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
            ignoreEnvFile: process.env.NODE_ENV === 'prod',
            // 환경변수 데이터 유효성 검증
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('dev', 'prod').required(),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.string().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().required(),
            }),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            // schema.gql 파일 생성 없이 메모리 상으로 저장
            autoSchemaFile: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD, // localhost 연결 시, postgres는 패스워드 필요 X
            database: process.env.DB_NAME,
            // true일 경우: TypeORM이 DB에 연결할 때, DB를 모듈의 현재 상태로 마이그레이션함 (production에서는 true 금지!!)
            synchronize: process.env.NODE_ENV !== 'prod', // prod 아닌 경우에만 true
            logging: process.env.NODE_ENV !== 'prod', // prod 아닌 경우에만 true
            entities: [User],
        }),
        UsersModule,
        CommonModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

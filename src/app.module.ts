import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { AuthModule } from './auth/auth.module';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './restaurants/entities/category.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

const TOKEN_KEY = 'x_token';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath:
                process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
            ignoreEnvFile: process.env.NODE_ENV === 'prod',
            // 환경변수 데이터 유효성 검증
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.string().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().required(),
                PRIVATE_KEY: Joi.string().required(),
                MAILGUN_API_KEY: Joi.string().required(),
                MAILGUN_DOMAIN: Joi.string().required(),
                MAILGUN_FROM_EMAIL: Joi.string().required(),
            }),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            subscriptions: {
                'graphql-ws': true,
                'subscriptions-transport-ws': {
                    onConnect: async (connectionParams: any) => {
                        // 웹소켓 요청 시 전송된 토큰을 context에 저장
                        return { token: connectionParams[TOKEN_KEY] };
                    },
                },
            },
            driver: ApolloDriver,
            // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            // schema.gql 파일 생성 없이 메모리 상으로 저장
            autoSchemaFile: true,
            context: ({ req, extra }) => {
                // http 요청 시 전송된 토큰을 context에 저장
                return { token: req ? req.headers[TOKEN_KEY] : extra.token };
            },
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
            // dev일 경우에만 true
            logging:
                process.env.NODE_ENV !== 'prod' &&
                process.env.NODE_ENV !== 'test',
            entities: [
                User,
                Verification,
                Restaurant,
                Category,
                Dish,
                Order,
                OrderItem,
            ],
        }),
        UsersModule,
        RestaurantsModule,
        CommonModule,
        JwtModule.forRoot({
            privateKey: process.env.PRIVATE_KEY,
        }),
        AuthModule,
        MailModule.forRoot({
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN,
            fromEmail: process.env.MAILGUN_FROM_EMAIL,
        }),
        OrdersModule,
    ],
    controllers: [],
    providers: [],
})

// middleware 설정 (각 라우트별 적용/제외, method 등 세부 설정 가능)
export class AppModule {
    // export class AppModule implements NestModule {
    // configure(consumer: MiddlewareConsumer) {
    //     consumer.apply(JwtMiddleware).forRoutes({
    //         // 특정 path 및 method에만 middleware 적용 가능
    //         path: '/graphql',
    //         method: RequestMethod.ALL,
    //     });
    // }
}

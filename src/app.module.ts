import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
// import { join } from 'path';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            // schema.gql 파일 생성 없이 메모리 상으로 저장
            autoSchemaFile: true,
        }),
        RestaurantsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

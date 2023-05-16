import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryResolver, RestaurantsResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { CategoryRepository } from './repositories/category.repository';

@Module({
    // TypeORM의 Repository 적용 (해당 모듈에서 사용할 저장소 등록)
    imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
    providers: [
        RestaurantsResolver,
        CategoryResolver,
        RestaurantService,
        CategoryRepository,
    ],
})
export class RestaurantsModule {}

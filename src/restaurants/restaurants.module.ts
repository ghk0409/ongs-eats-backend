import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import {
    CategoryResolver,
    DishResolver,
    RestaurantsResolver,
} from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
    // TypeORM의 Repository 적용 (해당 모듈에서 사용할 저장소 등록)
    imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository, Dish])],
    providers: [
        RestaurantsResolver,
        CategoryResolver,
        DishResolver,
        RestaurantService,
        CategoryRepository,
    ],
})
export class RestaurantsModule {}

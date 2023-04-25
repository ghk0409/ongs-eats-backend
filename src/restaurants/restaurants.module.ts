import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { Category } from './entities/category.entity';

@Module({
    // TypeORM의 Repository 적용 (해당 모듈에서 사용할 저장소 등록)
    imports: [TypeOrmModule.forFeature([Restaurant, Category])],
    providers: [RestaurantsResolver, RestaurantService],
})
export class RestaurantsModule {}

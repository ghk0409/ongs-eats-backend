import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

// classtype function을 명시 (넣어주지 않아도 무방)
@Resolver((of) => Restaurant)
export class RestaurantsResolver {
    // service 적용
    constructor(private readonly restaurantService: RestaurantService) {}
    // 데코레이터를 사용하여 필요 기능 처리
    @Query((returns) => [Restaurant])
    restaurants(): Promise<Restaurant[]> {
        return this.restaurantService.getAll();
    }

    @Mutation((returns) => Boolean)
    async createRestaurant(
        // 1. Args 분리형
        // @Args('name') name: string,
        // @Args('isBeef') isBeef: boolean,
        // @Args('address') address: string,
        // @Args('ownerName') ownerName: string,
        // 2. Args를 묶는 InputType형
        // @Args('createRestaurantInput')
        // createRestaurantInput: createRestaurantDto,
        // 3. Args를 묶는 ArgsType형
        @Args('input') // InputType 명시
        createRestaurantDto: CreateRestaurantDto,
    ): Promise<boolean> {
        try {
            await this.restaurantService.createRestaurant(createRestaurantDto);
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}

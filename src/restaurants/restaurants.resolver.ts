import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { createRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

// classtype function을 명시 (넣어주지 않아도 무방)
@Resolver((of) => Restaurant)
export class RestaurantsResolver {
    // 데코레이터를 사용하여 필요 기능 처리
    @Query((returns) => [Restaurant])
    restaurants(@Args('beefOnly') beefOnly: boolean): Restaurant[] {
        return [];
    }

    @Mutation((returns) => Boolean)
    createRestaurant(
        // 1. Args 분리형
        // @Args('name') name: string,
        // @Args('isBeef') isBeef: boolean,
        // @Args('address') address: string,
        // @Args('ownerName') ownerName: string,
        // 2. Args를 묶는 InputType형
        // @Args('createRestaurantInput')
        // createRestaurantInput: createRestaurantDto,
        // 3. Args를 묶는 ArgsType형
        @Args()
        createRestaurantDto: createRestaurantDto,
    ): boolean {
        console.log(createRestaurantDto);
        return true;
    }
}

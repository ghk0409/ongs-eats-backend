import {
    Args,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import {
    CreateRestaurantInput,
    CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/auth/role.decorator';
import {
    EditRestaurantInput,
    EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
    DeleteRestaurantInput,
    DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { Category } from './entities/category.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
    SearchRestaurantInput,
    SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';

// classtype function을 명시 (넣어주지 않아도 무방)
@Resolver((of) => Restaurant)
export class RestaurantsResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    // 음식점 생성 API
    @Mutation((returns) => CreateRestaurantOutput)
    @Role(['Owner'])
    async createRestaurant(
        @AuthUser() authUser: User,
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
        createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(
            authUser,
            createRestaurantInput,
        );
    }

    // 음식점 수정 API
    @Mutation((returns) => EditRestaurantOutput)
    @Role(['Owner'])
    async editRestaurant(
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(
            owner,
            editRestaurantInput,
        );
    }

    // 음식점 삭제 API
    @Mutation((returns) => DeleteRestaurantOutput)
    @Role(['Owner'])
    async deleteRestaurant(
        @AuthUser() owner: User,
        @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    ): Promise<DeleteRestaurantOutput> {
        return this.restaurantService.deleteRestaurant(
            owner,
            deleteRestaurantInput,
        );
    }

    // 음식점 조회 API
    @Query((returns) => RestaurantsOutput)
    restaurants(
        @Args('input') restaurantsInput: RestaurantsInput,
    ): Promise<RestaurantsOutput> {
        return this.restaurantService.allRestaurants(restaurantsInput);
    }

    // 특정 음식점 조회 API
    @Query((returns) => RestaurantOutput)
    restaurant(
        @Args('input') restaurantInput: RestaurantInput,
    ): Promise<RestaurantOutput> {
        return this.restaurantService.findRestaurantById(restaurantInput);
    }

    // 음식점 검색 API
    @Query((returns) => SearchRestaurantOutput)
    searchRestaurant(
        @Args('input') searchRestaurantInput: SearchRestaurantInput,
    ): Promise<SearchRestaurantOutput> {
        return this.restaurantService.searchRestaurantByName(
            searchRestaurantInput,
        );
    }
}

@Resolver((of) => Category)
export class CategoryResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    // 특정 카테고리 음식점 개수 API
    // ResolveField를 통해 Dynamic Field 생성
    @ResolveField((type) => Int)
    restaurantCount(@Parent() category: Category): Promise<number> {
        // await 없는 이유는 Promise를 반환하면 브라우저가 알아서 결과 나올 때까지 기다림
        return this.restaurantService.countRestaurants(category);
    }

    // 모든 카테고리 조회 API
    @Query((returns) => AllCategoriesOutput)
    allCategories(): Promise<AllCategoriesOutput> {
        return this.restaurantService.allCategories();
    }

    // 특정 카테고리 조회 API
    @Query((returns) => CategoryOutput)
    category(
        @Args('input') categoryInput: CategoryInput,
    ): Promise<CategoryOutput> {
        return this.restaurantService.findCategoryBySlug(categoryInput);
    }
}

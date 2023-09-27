import {
    Args,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';

import { AllCategoriesOutput } from './dtos/category/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/dish/create-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/dish/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/dish/edit-dish.dto';
import {
    CreateRestaurantInput,
    CreateRestaurantOutput,
} from './dtos/restaurant/create-restaurant.dto';
import {
    DeleteRestaurantInput,
    DeleteRestaurantOutput,
} from './dtos/restaurant/delete-restaurant.dto';
import {
    EditRestaurantInput,
    EditRestaurantOutput,
} from './dtos/restaurant/edit-restaurant.dto';
import {
    RestaurantInput,
    RestaurantOutput,
} from './dtos/restaurant/restaurant.dto';
import {
    RestaurantsInput,
    RestaurantsOutput,
} from './dtos/restaurant/restaurants.dto';
import {
    SearchRestaurantInput,
    SearchRestaurantOutput,
} from './dtos/restaurant/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

// Restaurant Resolver
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

// Category Resolver
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

// Dish Resolver
@Resolver((of) => Dish)
export class DishResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    @Mutation((type) => CreateDishOutput)
    @Role(['Owner'])
    createDish(
        @Args('input') createDishInput: CreateDishInput,
        @AuthUser() owner: User,
    ): Promise<CreateDishOutput> {
        return this.restaurantService.createDish(owner, createDishInput);
    }

    @Mutation((type) => EditDishOutput)
    @Role(['Owner'])
    editDish(
        @Args('input') editDishInput: EditDishInput,
        @AuthUser() owner: User,
    ): Promise<EditDishOutput> {
        return this.restaurantService.editDish(owner, editDishInput);
    }

    @Mutation((type) => DeleteDishOutput)
    @Role(['Owner'])
    deleteDish(
        @Args('input') deleteDishInput: DeleteDishInput,
        @AuthUser() owner: User,
    ): Promise<DeleteDishOutput> {
        return this.restaurantService.deleteDish(owner, deleteDishInput);
    }
}

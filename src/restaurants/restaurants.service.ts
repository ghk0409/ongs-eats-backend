import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { ILike, Repository } from 'typeorm';

import { AllCategoriesOutput } from './dtos/category/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category/category.dto';
import { CreateDishOutput } from './dtos/dish/create-dish.dto';
import { CreateDishInput } from './dtos/dish/create-dish.dto';
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
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantService {
    constructor(
        // module에 등록된 repository 주입 (데코레이터를 사용해서 간단하게 사용 - getRepository() 기능)
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly categories: CategoryRepository,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
    ) {}

    // create - 데이터 저장
    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        try {
            // save하기 전에는 저장되지 않는 create로 restaurant 개체 생성
            const newRestaurant = this.restaurants.create(
                createRestaurantInput,
            );
            // owner를 restaurant에 추가
            newRestaurant.owner = owner;

            // category 생성(또는 기존 category 반환)
            const category = await this.categories.getOrCreate(
                createRestaurantInput.categoryName,
            );
            console.log(category);

            newRestaurant.category = category;

            await this.restaurants.save(newRestaurant);

            return {
                ok: true,
            };
        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: '음식점을 생성할 수 없습니다!!',
            };
        }
    }

    // edit - 레스토랑 수정
    async editRestaurant(
        owner: User,
        editRestaurantInput: EditRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        try {
            // 1. restaurant 찾기
            const restaurant = await this.findRestaurant(
                editRestaurantInput.restaurantId,
            );
            // 2. 에러 처리
            // 2-1. restaurant가 없을 경우 false
            if (!restaurant) {
                return {
                    ok: false,
                    error: '음식점을 찾을 수 없습니다!!',
                };
            }
            // 2-2. restaurant의 owner가 아닐 경우 false
            if (!this.checkOwner(owner.id, restaurant.id)) {
                return {
                    ok: false,
                    error: '소유하지 않은 음식점이므로 삭제할 권한이 없습니다!!',
                };
            }

            // 3. restaurant 수정
            let category: Category = null;

            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(
                    editRestaurantInput.categoryName,
                );
            }

            // restaurant 업데이트
            await this.restaurants.save([
                {
                    // typeorm에서 id값이 있으면 update, 없으면 create
                    id: editRestaurantInput.restaurantId,
                    ...editRestaurantInput,
                    // category가 존재하면 object인 category를 리턴, ...이 {}를 풀어줌
                    // category가 null이면 category를 리턴하지 않음(null로 업데이트 안되도록)
                    ...(category && { category }),
                },
            ]);

            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: '음식점 정보를 수정할 수 없습니다!!',
            };
        }
    }

    // delete - 레스토랑 삭제
    async deleteRestaurant(
        owner: User,
        { restaurantId }: DeleteRestaurantInput,
    ): Promise<DeleteRestaurantOutput> {
        try {
            // restaurant 체크
            const restaurant = await this.findRestaurant(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: '음식점을 찾을 수 없습니다!!',
                };
            }

            // owner 체크
            if (!this.checkOwner(owner.id, restaurantId)) {
                return {
                    ok: false,
                    error: '소유하지 않은 음식점이므로 삭제할 권한이 없습니다!!',
                };
            }

            console.log('delete restaurant', restaurant);
            await this.restaurants.delete(restaurantId);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '음식점 정보를 삭제할 수 없습니다!!',
            };
        }
    }

    // owner 체크 메서드
    private checkOwner(ownerId: number, restaurantId: number): boolean {
        if (ownerId !== restaurantId) {
            return false;
        }
        return true;
    }

    // restaurant 체크 메서드
    private async findRestaurant(restaurantId: number): Promise<Restaurant> {
        const restaurant = await this.restaurants.findOne({
            where: {
                id: restaurantId,
            },
        });

        return restaurant;
    }

    // find - 모든 음식점 조회
    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find();

            return {
                ok: true,
                categories,
            };
        } catch (error) {
            return {
                ok: false,
                error: '카테고리를 불러올 수 없습니다!! ' + error,
            };
        }
    }

    // category count 메서드
    countRestaurants(category: Category): Promise<number> {
        return this.restaurants.count({
            where: {
                category: {
                    id: category.id,
                },
            },
        });
    }

    // findOne - 특정 카테고리 조회 메서드 (by slug)
    async findCategoryBySlug({
        slug,
        page,
    }: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({
                where: { slug },
            });

            if (!category) {
                return {
                    ok: false,
                    error: '카테고리를 찾을 수 없습니다!!',
                };
            }

            // categorys에서 restaurant relation을 하면 너무 많을 경우 DB 과부하
            // 찾아온 특정 category에 해당하는 restaurants만 찾기
            const restaurants = await this.restaurants.find({
                where: {
                    category: {
                        id: category.id,
                    },
                },
                // 한 번에 25개를 받아오도록
                take: 25,
                // page가 1이면 0부터 시작, 2면 25부터 시작하도록 25개씩 스킵
                skip: (page - 1) * 25,
            });

            const totalResults = await this.countRestaurants(category);

            return {
                ok: true,
                category,
                restaurants,
                totalPages: Math.ceil(totalResults / 25),
            };
        } catch (error) {
            return {
                ok: false,
                error: '카테고리를 불러올 수 없습니다!! ' + error,
            };
        }
    }

    // find - 모든 음식점 조회 메서드
    async allRestaurants({
        page,
    }: RestaurantsInput): Promise<RestaurantsOutput> {
        try {
            // 페이징 처리
            const [restaurants, totalResults] =
                await this.restaurants.findAndCount({
                    skip: (page - 1) * 25,
                    take: 25,
                });

            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / 25),
                totalResults,
            };
        } catch (error) {
            return {
                ok: false,
                error: '음식점을 찾을 수 없습니다!! ' + error,
            };
        }
    }

    // find - 특정 음식점 조회 메서드
    async findRestaurantById({
        restaurantId,
    }: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
                relations: ['menu'], // menu relation 가져오기
            });

            if (!restaurant) {
                return {
                    ok: false,
                    error: '음식점을 찾을 수 없습니다!!',
                };
            }

            return {
                ok: true,
                restaurant,
            };
        } catch (error) {
            return {
                ok: false,
                error: '음식점을 찾을 수 없습니다!! ' + error,
            };
        }
    }

    // search - 음식점 검색 메서드
    async searchRestaurantByName({
        query,
        page,
    }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] =
                await this.restaurants.findAndCount({
                    where: {
                        // name 컬럼에서 query를 포함하는 값 찾기 (대소문자 구분 X)
                        name: ILike(`%${query}%`),
                        // Raw를 사용하면 직접 쿼리를 작성할 수 있음
                        // name: Raw((name) => `${name} ILike '%${query}%'`),
                    },
                    take: 25,
                    skip: (page - 1) * 25,
                });

            return {
                ok: true,
                restaurants,
                totalPages: Math.ceil(totalResults / 25),
                totalResults,
            };
        } catch (error) {
            return {
                ok: false,
                error: '음식점을 찾을 수 없습니다!! ' + error,
            };
        }
    }

    // create - 메뉴 생성 메서드
    async createDish(
        owner: User,
        createDishInput: CreateDishInput,
    ): Promise<CreateDishOutput> {
        try {
            // 1. restaurant 찾기
            const restaurant = await this.restaurants.findOne({
                where: { id: createDishInput.restaurantId },
            });

            if (!restaurant) {
                return {
                    ok: false,
                    error: '음식점을 찾을 수 없습니다!!',
                };
            }

            // 2. owner 체크
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: '메뉴를 생성할 권한이 없습니다^^',
                };
            }

            // 3. 메뉴 생성
            const dish = await this.dishes.save(
                this.dishes.create({ ...createDishInput, restaurant }),
            );

            console.log(dish);
            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '메뉴를 생성할 수 없습니다!! ' + error,
            };
        }
    }

    // edit - 메뉴 수정 메서드
    async editDish(
        owner: User,
        editDishInput: EditDishInput,
    ): Promise<EditDishOutput> {
        try {
            // 1. 메뉴 찾기
            const dish = await this.dishes.findOne({
                where: { id: editDishInput.dishId },
                relations: ['restaurant'],
            });

            if (!dish) {
                return {
                    ok: false,
                    error: '메뉴를 찾을 수 없습니다!!',
                };
            }

            // 2. owner 체크
            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: '메뉴를 삭제할 권한이 없습니다^^',
                };
            }

            // 3. 메뉴 수정
            await this.dishes.save([
                {
                    id: editDishInput.dishId,
                    ...editDishInput,
                },
            ]);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '메뉴를 수정할 수 없습니다!! ' + error,
            };
        }
    }

    // delete - 메뉴 삭제 메서드
    async deleteDish(
        owner: User,
        { dishId }: DeleteDishInput,
    ): Promise<DeleteDishOutput> {
        try {
            // 1. 메뉴 찾기
            const dish = await this.dishes.findOne({
                where: { id: dishId },
                relations: ['restaurant'],
            });

            if (!dish) {
                return {
                    ok: false,
                    error: '메뉴를 찾을 수 없습니다!!',
                };
            }

            // 2. owner 체크
            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: '메뉴를 삭제할 권한이 없습니다^^',
                };
            }

            // 3. 메뉴 삭제
            await this.dishes.delete(dishId);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '메뉴를 삭제할 수 없습니다!! ' + error,
            };
        }
    }
}

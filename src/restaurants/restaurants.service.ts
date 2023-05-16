import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CreateRestaurantInput,
    CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
    EditRestaurantInput,
    EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import {
    DeleteRestaurantInput,
    DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';

@Injectable()
export class RestaurantService {
    constructor(
        // module에 등록된 repository 주입 (데코레이터를 사용해서 간단하게 사용 - getRepository() 기능)
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly categories: CategoryRepository,
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
}

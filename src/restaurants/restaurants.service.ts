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

    async editRestaurant(
        owner: User,
        editRestaurantInput: EditRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        try {
            // 1. restaurant 찾기
            const restaurant = await this.restaurants.findOne({
                where: {
                    id: editRestaurantInput.restaurantId,
                },
            });
            console.log(restaurant);

            // 2. 에러 처리
            // 2-1. restaurant가 없을 경우 false
            if (!restaurant) {
                return {
                    ok: false,
                    error: '음식점을 찾을 수 없습니다!!',
                };
            }
            // 2-2. restaurant의 owner가 아닐 경우 false
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: '소유하지 않은 음식점이므로 수정할 권한이 없습니다!!',
                };
            }

            // 3. restaurant 수정
            let category: Category = null;

            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(
                    editRestaurantInput.categoryName,
                );
            }

            await this.restaurants.save([
                {
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
}

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

@Injectable()
export class RestaurantService {
    constructor(
        // module에 등록된 repository 주입 (데코레이터를 사용해서 간단하게 사용 - getRepository() 기능)
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categories: Repository<Category>,
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

            // slug 생성 (입력받은 categoryName의 통일성을 위함)
            // 앞 뒤 공백 제거 및 소문자로 변환
            const categoryName = createRestaurantInput.categoryName
                .trim()
                .toLowerCase();
            // 띄어쓰기를 -로 변환
            const categorySlug = categoryName.replace(/ /g, '-');

            // 해당 slug로 일치하는 카테고리가 있는지 확인
            let category = await this.categories.findOne({
                where: { slug: categorySlug },
            });
            // 없으면 생성
            if (!category) {
                category = await this.categories.save(
                    this.categories.create({
                        slug: categorySlug,
                        name: categoryName,
                    }),
                );
            }
            newRestaurant.category = category;

            await this.restaurants.save(newRestaurant);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '음식점을 생성할 수 없습니다!!',
            };
        }
    }
}

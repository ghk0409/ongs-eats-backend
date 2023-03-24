import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
    constructor(
        // module에 등록된 repository 주입 (데코레이터를 사용해서 간단하게 사용 - getRepository() 기능)
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
    ) {}

    // getAll - 모든 데이터 로드
    getAll(): Promise<Restaurant[]> {
        return this.restaurants.find();
    }

    // create - 데이터 저장
    createRestaurant(
        createRestaurantDto: CreateRestaurantDto,
    ): Promise<Restaurant> {
        // repository를 사용한 내장 메서드를 통해 생성 - 저장 진행
        const newRestaurant = this.restaurants.create(createRestaurantDto);
        return this.restaurants.save(newRestaurant);
    }

    // update - 데이터 수정
    updateRestaurant({ id, data }: UpdateRestaurantDto) {
        return this.restaurants.update(id, { ...data });
    }
}

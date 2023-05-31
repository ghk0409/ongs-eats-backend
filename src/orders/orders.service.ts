import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
    ) {}

    async createOrder(
        customer: User,
        { restaurantId, items }: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        try {
            // 1. restaurant 존재여부 확인
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
            });

            if (!restaurant)
                return {
                    ok: false,
                    error: '선택한 음식점이 존재하지 않습니다!!',
                };

            // 2. order 생성
            const order = await this.orders.save(
                this.orders.create({ customer, restaurant }),
            );
            console.log('123123', order);
            // 3. orderItem 생성
        } catch (error) {
            return {
                ok: false,
                error: '주문할 수 없습니다!: ' + error,
            };
        }
    }
}

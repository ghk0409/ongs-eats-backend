import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Dish)
        private readonly dish: Repository<Dish>,
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

            // 총 주문 가격
            let orderFinalPrice = 0;
            // 최종 주문 메뉴 리스트
            const orderItems: OrderItem[] = [];

            //  forEach에서는 return 불가능하므로 for of 사용 (메뉴 없을 경우 대비)
            for (const item of items) {
                // 해당 메뉴가 존재하는지 확인
                const dish = await this.dish.findOne({
                    where: { id: item.dishId },
                });
                // 메뉴가 없을 경우 해당 작업 전부 취소!
                if (!dish) {
                    return {
                        ok: false,
                        error: '선택한 메뉴가 존재하지 않습니다!!',
                    };
                }
                let dishFinalPrice = dish.price;

                // dish.options 에서 옵션 찾기
                // const dishOptions = dish.options
                for (const itemOption of item.options) {
                    // itemOption의 name과 동일한 dishOption 찾기
                    const dishOption = dish.options.find(
                        (dishOption) => dishOption.name === itemOption.name,
                    );

                    if (dishOption) {
                        if (dishOption.extra) {
                            dishFinalPrice += dishOption.extra;
                        } else {
                            const dishOptionChoice = dishOption.choices.find(
                                (optionChoice) =>
                                    optionChoice.name === itemOption.choices,
                            );
                            if (dishOptionChoice) {
                                if (dishOptionChoice.extra) {
                                    dishFinalPrice += dishOptionChoice.extra;
                                }
                            }
                        }
                    }
                }
                orderFinalPrice += dishFinalPrice;

                // 주문 메뉴 생성
                const orderItem = await this.orderItems.save(
                    this.orderItems.create({
                        dish,
                        options: item.options,
                    }),
                );
                // 2. orderItems에 생성한 주문 메뉴 추가
                orderItems.push(orderItem);
            }

            // 3. order 생성
            const order = await this.orders.save(
                this.orders.create({
                    customer,
                    restaurant,
                    total: orderFinalPrice,
                    items: orderItems,
                }),
            );

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '주문할 수 없습니다!: ' + error,
            };
        }
    }
}

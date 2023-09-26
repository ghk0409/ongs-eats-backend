import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { stat } from 'fs';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';

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
        @Inject(PUB_SUB)
        private readonly pubSub: PubSub,
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

            // 4. pubsub으로 새로운 주문 생성 알림
            await this.pubSub.publish(NEW_PENDING_ORDER, {
                pendingOrders: order,
            });

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

    async getOrders(
        user: User,
        { status }: GetOrdersInput,
    ): Promise<GetOrdersOutput> {
        try {
            let orders: Order[];
            // user Role 확인
            // owner은 받은 주문 내역, customer는 주문한 내역, delivery는 배달한 내역을 보여줘야 함
            if (user.role === UserRole.Client) {
                orders = await this.orders.find({
                    where: {
                        customer: {
                            id: user.id,
                        },
                        ...(status && { status }), // status가 존재하면 status를 where에 추가
                    },
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.orders.find({
                    where: {
                        driver: {
                            id: user.id,
                        },
                        ...(status && { status }), // status가 존재하면 status를 where에 추가
                    },
                });
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurants.find({
                    where: {
                        owner: {
                            id: user.id,
                        },
                    },
                    // select: ['orders'],
                    relations: ['orders'],
                });

                // restaurants 리스트에서 orders 값만 가져오기
                // flat(1) : 1차원 배열로 만들기
                orders = restaurants
                    .map((restaurant) => restaurant.orders)
                    .flat(1);

                // status가 존재하면 해당 status의 주문 내역만 가져오기 (필터링)
                if (status) {
                    orders = orders.filter((order) => order.status === status);
                }

                console.log(orders);
            }

            return {
                ok: true,
                orders,
            };
        } catch (error) {
            return {
                ok: false,
                error: '주문 내역을 불러올 수 없습니다!: ' + error,
            };
        }
    }

    // user와 order 간의 권한 확인 메서드
    private canAllowed(user: User, order: Order): boolean {
        // 해당 주문에 대한 권한 확인 (user id 비교 + role 확인)
        // 해당 주문을 본인이 주문했거나, 배달한 주문이거나, 음식점 주인이면 주문 내역 확인 가능
        let allowed = true;

        if (user.role === UserRole.Client && order.customerId !== user.id) {
            allowed = false;
        }
        if (user.role === UserRole.Delivery && order.driverId !== user.id) {
            allowed = false;
        }
        if (
            user.role === UserRole.Owner &&
            order.restaurant.ownerId !== user.id
        ) {
            allowed = false;
        }

        return allowed;
    }

    async getOrder(
        user: User,
        { id: orderId }: GetOrderInput, // orderId로 이름 재정의
    ): Promise<GetOrderOutput> {
        try {
            const order = await this.orders.findOne({
                where: { id: orderId },
                // customer과 driver의 id는 RelationId를 통해 구현
                // restaurant는 그 안의 ownerId가 필요하므로 relation 사용
                relations: ['restaurant'],
            });

            // 주문 내역이 없을 경우
            if (!order) {
                return {
                    ok: false,
                    error: '주문 내역을 찾을 수 없습니다!',
                };
            }

            // 주문에 대한 열람 권한 확인
            if (!this.canAllowed(user, order)) {
                return {
                    ok: false,
                    error: '주문 내역을 볼 수 있는 권한이 없습니다!',
                };
            }

            return {
                ok: true,
                order,
            };
        } catch (error) {
            return {
                ok: false,
                error: '주문 내역을 불러올 수 없습니다!: ' + error,
            };
        }
    }

    async editOrder(
        user: User,
        { id: orderId, status }: EditOrderInput,
    ): Promise<EditOrderOutput> {
        try {
            const order = await this.orders.findOne({
                where: {
                    id: orderId,
                },
                relations: ['restaurant'],
            });

            if (!order) {
                return {
                    ok: false,
                    error: '주문 내역을 찾을 수 없습니다!',
                };
            }

            // 주문 내역에 대한 권한 확인
            if (!this.canAllowed(user, order)) {
                return {
                    ok: false,
                    error: '주문 내역을 확인할 권한이 없습니다!',
                };
            }

            let canEdit = true;
            // customer의 경우 수정 불가능
            if (user.role === UserRole.Client) {
                canEdit = false;
            }
            // 주문 내역 수정 관련 로직
            // owner는 Cooking, Cooked 상태로 변경 가능
            else if (user.role === UserRole.Owner) {
                if (
                    status !== OrderStatus.Cooking &&
                    status !== OrderStatus.Cooked
                ) {
                    canEdit = false;
                }
            }
            // delivery는 PickedUp, Delivered 상태로 변경 가능
            else if (user.role === UserRole.Delivery) {
                if (
                    status !== OrderStatus.PickedUp &&
                    status !== OrderStatus.Delivered
                ) {
                    canEdit = false;
                }
            }

            if (!canEdit) {
                return {
                    ok: false,
                    error: '주문 내역을 수정할 수 없습니다! 권한이 없거나 잘못된 수정입니다!',
                };
            }

            await this.orders.save([
                {
                    id: orderId,
                    status,
                },
            ]);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: '주문 내역을 수정할 수 없습니다!: ' + error,
            };
        }
    }
}

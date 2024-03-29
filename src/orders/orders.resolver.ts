import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
    NEW_COOKED_ORDER,
    NEW_ORDER_UPDATE,
    NEW_PENDING_ORDER,
    PUB_SUB,
} from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';

import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdateInput } from './dtos/update-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Resolver((of) => Order)
export class OrdersResolver {
    constructor(
        private readonly ordersService: OrdersService,
        @Inject(PUB_SUB)
        private readonly pubSub: PubSub,
    ) {}

    @Mutation((returns) => CreateOrderOutput)
    @Role(['Client'])
    async createOrder(
        @AuthUser() customer: User,
        @Args('input')
        createOrderInput: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        return this.ordersService.createOrder(customer, createOrderInput);
    }

    @Query((returns) => GetOrdersOutput)
    @Role(['Any'])
    async getOrders(
        @AuthUser() user: User,
        @Args('input') getOrdersInput: GetOrdersInput,
    ): Promise<GetOrdersOutput> {
        return this.ordersService.getOrders(user, getOrdersInput);
    }

    @Query((returns) => GetOrderOutput)
    @Role(['Any'])
    async getOrder(
        @AuthUser() user: User,
        @Args('input') getOrderInput: GetOrderInput,
    ): Promise<GetOrderOutput> {
        return this.ordersService.getOrder(user, getOrderInput);
    }

    @Mutation((returns) => EditOrderOutput)
    @Role(['Any']) // 또는 @Role(['Owner', 'Delivery'])
    async editOrder(
        @AuthUser() user: User,
        @Args('input') editOrderInput: EditOrderInput,
    ): Promise<EditOrderOutput> {
        return this.ordersService.editOrder(user, editOrderInput);
    }

    @Subscription((returns) => Order, {
        filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
            console.log(ownerId, user.id);
            return ownerId === user.id;
        },
        resolve: ({ pendingOrders: { order } }) => order,
    })
    @Role(['Owner'])
    pendingOrders() {
        return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
    }

    // Driver용
    @Subscription((returns) => Order)
    @Role(['Delivery'])
    cookedOrders() {
        return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
    }

    @Subscription((returns) => Order, {
        filter: (
            { orderUpdates: order }: { orderUpdates: Order },
            { input }: { input: OrderUpdateInput },
            { user }: { user: User },
        ) => {
            // 해당 주문의 driver, customer, restaurant owner만
            if (
                order.driverId !== user.id &&
                order.customerId !== user.id &&
                order.restaurant.ownerId !== user.id
            ) {
                return false;
            }
            // 사용자가 원하는 주문 id일 경우만
            return order.id === input.id;
        },
    })
    @Role(['Any'])
    orderUpdates(@Args('input') orderUpdateInput: OrderUpdateInput) {
        return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
    }

    // // Test용 Mutation
    // @Mutation((returns) => Boolean)
    // sweetPotatoReady(@Args('potatoId') potatoId: number) {
    //     this.pubSub.publish('sweetPotatos', {
    //         orderSubscription: potatoId,
    //     }); // 해당하는 subscription 이름(트리거 이름)으로 publish
    //     return true;
    // }

    // // Test용 Subcription
    // @Subscription((returns) => String, {
    //     filter: ({ orderSubscription }, { potatoId }) => {
    //         return orderSubscription === potatoId;
    //     },
    //     resolve: ({ orderSubscription }) => {
    //         return `Your potato with the id ${orderSubscription} is ready!`;
    //     },
    // })
    // @Role(['Any'])
    // orderSubscription(@Args('potatoId') potatoId: number) {
    //     console.log(potatoId);
    //     return this.pubSub.asyncIterator('sweetPotatos'); // 트리거 등록 (기다리는 이벤트 이름, subscription 이름)
    // }
}

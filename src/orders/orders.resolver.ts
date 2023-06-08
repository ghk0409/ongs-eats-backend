import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

@Resolver((of) => Order)
export class OrdersResolver {
    constructor(private readonly ordersService: OrdersService) {}

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

    // Test용 Mutation
    @Mutation((returns) => Boolean)
    sweetPotatoReady() {
        pubsub.publish('sweetPotatos', { orderSubscription: '고구마 완성~!!' }); // 해당하는 subscription 이름(트리거 이름)으로 publish
        return true;
    }

    // Test용 Subcription
    @Subscription((returns) => String)
    @Role(['Any'])
    orderSubscription(@AuthUser() user: User) {
        console.log(user);
        return pubsub.asyncIterator('sweetPotatos'); // 트리거 등록 (기다리는 이벤트 이름, subscription 이름)
    }
}

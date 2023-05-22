import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';

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
}

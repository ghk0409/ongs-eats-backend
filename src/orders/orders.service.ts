import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly orders: Repository<Order>,
    ) {}

    async createOrder(
        customer: User,
        createOrderInput: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        try {
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

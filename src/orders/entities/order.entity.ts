import {
    Field,
    Float,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    Pending = 'Pending',
    Cooking = 'Cooking',
    PickedUp = 'PickedUp',
    Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
    // 1 유저(customer) 당 여러 주문 가능
    @Field((type) => User, { nullable: true })
    @ManyToOne((type) => User, (user) => user.orders, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    customer?: User;

    // 1 유저(driver) 당 여러 배달 가능
    @Field((type) => User, { nullable: true })
    @ManyToOne((type) => User, (user) => user.rides, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    driver?: User;

    // 1 유저(owner) 당 여러 주문 가능
    @Field((type) => Restaurant, { nullable: true })
    @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    restaurant?: Restaurant;

    // OrderItem와 Order는 서로 다대다 관계
    // OrderItem는 어떤 Order를 가졌는지 알 수 없지만 Order는 어떤 OrderItem를 가졌는지 알아야 하므로 JoinTable()을 여기에 사용
    // ManyToMany에서는 through table이 만들어짐 (order_items_order_item 테이블이 만들어짐, in betweent table)
    @Field((type) => [OrderItem])
    @ManyToMany((type) => OrderItem)
    @JoinTable()
    items: OrderItem[];

    @Column({ nullable: true })
    @Field((type) => Float, { nullable: true })
    @IsNumber()
    total?: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
    @Field((type) => OrderStatus)
    @IsEnum(OrderStatus)
    status: OrderStatus;
}

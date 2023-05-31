import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
    Dish,
    DishChoice,
    DishOption,
} from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
    @Field((type) => String)
    name: string;

    @Field((type) => [DishChoice], { nullable: true })
    choice?: DishChoice;

    @Field((type) => Int, { nullable: true })
    extra?: number;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
    // OrderItem에서만 Dish로 접근하기 때문에 Dish에서 OneToMany를 사용하지 않음
    @Field((type) => Dish, { nullable: true })
    @ManyToOne((type) => Dish, { nullable: true, onDelete: 'CASCADE' })
    dish: Dish;

    // 메뉴별 옵션을 위한 json 데이터 타입
    @Field((type) => [OrderItemOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    options?: OrderItemOption[];
}

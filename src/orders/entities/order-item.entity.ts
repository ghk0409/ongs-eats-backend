import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
    @Field((type) => String)
    name: string;

    @Field((type) => String, { nullable: true })
    choices: string;
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
    // option이 json이기 때문에 관련 entity를 만들지 않아도 되지만 데이터 검증은 typeorm이나 nestjs에서 할 수 없음
    // 대신 json이기 때문에 자유롭게 생성, 수정 등이 가능할 수 있음
    @Field((type) => [OrderItemOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    options?: OrderItemOption[];
}

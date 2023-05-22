import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
    @Field((type) => String)
    name: string;
    @Field((type) => Int, { nullable: true })
    extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
    @Field((type) => String)
    name: string;

    @Field((type) => [DishChoice], { nullable: true })
    choices?: DishChoice[];

    @Field((type) => Int, { nullable: true })
    extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
    // GraphQL 필드 및 DB 테이블 컬럼 데코레이터
    @Field((type) => String) // GraphQL
    @Column({ unique: true })
    @IsString()
    @Length(3, 25)
    name: string;

    @Field((type) => Int)
    @Column()
    @IsNumber()
    price: number;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    photo?: string;

    @Field((type) => String)
    @Column()
    @Length(3, 140)
    description: string;

    // 1개의 restaurant은 여러개의 dish를 가질 수 있음
    @Field((type) => Restaurant, { nullable: true })
    @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
        onDelete: 'CASCADE', // restaurant가 삭제되면, restaurant의 모든 메뉴(dish)도 삭제
        nullable: false, // restaurant가 없는데 생성되지 않도록 null 막기
    })
    restaurant: Restaurant;

    @RelationId((dish: Dish) => dish.restaurant)
    restaurantId: number;

    // 메뉴별 옵션을 위한 json 데이터 타입
    @Field((type) => [DishOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    options?: DishOption[];
}

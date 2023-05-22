import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    @Length(3, 50)
    name: string;

    @Field((type) => String)
    @Column()
    @IsString()
    coverImg: string;

    @Field((type) => String)
    @Column({ default: 'Daejeon' })
    @IsString()
    address: string;

    // category를 삭제할 때, restaurant는 삭제되지 않도록 nullable 설정
    @Field((type) => Category, { nullable: true })
    @ManyToOne((type) => Category, (category) => category.restaurants, {
        nullable: true,
        onDelete: 'SET NULL', // category가 삭제되면, restaurant의 category는 null로 설정
    })
    category: Category;

    // owner가 삭제되면 해당 restaurant도 삭제되도록 설정
    @Field((type) => User)
    @ManyToOne((type) => User, (user) => user.restaurants, {
        onDelete: 'CASCADE',
    })
    owner: User;

    // RelationId() 데코레이터를 사용하여 relation이 설정된 entity의 id를 가져올 수 있음
    // relation이 설정된 owner 컬럼의 User 엔티티에 대한 id를 가져옴
    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;

    // 1개의 restaurant는 여러 개의 dish를 가질 수 있음
    @Field((type) => [Dish])
    @OneToMany((type) => Dish, (dish) => dish.restaurant)
    menu: Dish[];
}

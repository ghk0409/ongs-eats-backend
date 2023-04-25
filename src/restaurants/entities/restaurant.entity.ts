import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    @Length(3, 10)
    name: string;

    @Field((type) => String)
    @Column()
    @IsString()
    coverImg: string;

    @Field((type) => String, { defaultValue: '여의도' })
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
    @ManyToOne((type) => User, (user) => user.restaurants)
    owner: User;
}

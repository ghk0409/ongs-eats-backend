import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';

import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
    // GraphQL 필드 및 DB 테이블 컬럼 데코레이터
    @Field((type) => String) // GraphQL
    @Column({ unique: true })
    @IsString()
    @Length(3, 10)
    name: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    coverImg: string;

    @Field((type) => String)
    @Column({ unique: true })
    @IsString()
    slug: string;

    @Field((type) => [Restaurant])
    @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
    restaurants: Restaurant[];
}

import { Field, ObjectType } from '@nestjs/graphql';
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

// DB Entity 및 GraphQL 설정
@ObjectType()
export class CoreEntity {
    @PrimaryGeneratedColumn()
    @Field((type) => Number)
    id: number;

    @CreateDateColumn()
    @Field((type) => Date)
    createdAt: Date;

    @UpdateDateColumn()
    @Field((type) => Date)
    updatedAt: Date;
}

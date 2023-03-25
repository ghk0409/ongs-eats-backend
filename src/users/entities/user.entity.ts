import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

// user role 타입 지정
type UserRole = 'client' | 'owner' | 'delivery';

// DB Entity 및 GraphQL 설정
@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
    @Column()
    @Field((type) => String)
    email: string;

    @Column()
    @Field((type) => String)
    password: string;

    @Column()
    @Field((type) => String)
    role: UserRole;
}

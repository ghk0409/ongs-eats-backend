import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

// user role 타입 지정
// type UserRole = 'client' | 'owner' | 'delivery';
// enum type으로 user role 지정
enum UserRole {
    Client,
    Owenr,
    Delivery,
}
// GraphQL에도 enum 타입 지정
registerEnumType(UserRole, { name: 'UserRole' });

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

    @Column({ type: 'enum', enum: UserRole })
    @Field((type) => UserRole)
    role: UserRole;
}

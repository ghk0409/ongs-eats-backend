import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

// create-account input data 타입
@InputType()
export class CreateAccountInput extends PickType(User, [
    'email',
    'password',
    'role',
]) {}

// create-account outpu data 타입 (API return)
@ObjectType()
export class CreateAccountOutput {
    @Field((type) => String, { nullable: true })
    error?: string;

    @Field((type) => Boolean)
    ok: boolean;
}

import {
    Field,
    InputType,
    ObjectType,
    PartialType,
    PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

// create-account input data 타입
@InputType()
export class CreateAccountInput extends PickType(User, [
    'email',
    'password',
    'role',
]) {}

// create-account outpu data 타입 (API return) - PartailType 사용으로 좀 더 nest스럽게
@ObjectType()
export class CreateAccountOutput extends PartialType(CoreOutput) {}

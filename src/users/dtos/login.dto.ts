import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { MutationOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

// login input DTO 클래스
@InputType()
export class LoginInput extends PickType(User, ['email', 'password']) {}

// login output DTO 클래스
@ObjectType()
export class LoginOutput extends MutationOutput {
    @Field((type) => String, { nullable: true })
    token?: string;
}

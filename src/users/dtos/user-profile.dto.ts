import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

import { User } from '../entities/user.entity';

@ArgsType()
export class UserProfileInput {
    @Field((type) => Number)
    userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
    // ok, error는 CoreOutput에서 상속받음
    // user를 못 찾는 경우도 있으므로 nullable: true (DB에 없는 경우도 있으므로)
    @Field((type) => User, { nullable: true })
    user?: User;
}

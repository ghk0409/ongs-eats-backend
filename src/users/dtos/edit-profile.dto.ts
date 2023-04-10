import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ObjectType()
export class EditProfileOutput extends CoreOutput {}

// ProfileInput 타입 같은 경우, PickType으로 email/password를 가져온 뒤, PartialType으로 옵션 처리
@InputType()
export class EditProfileInput extends PartialType(
    PickType(User, ['email', 'password']),
) {}

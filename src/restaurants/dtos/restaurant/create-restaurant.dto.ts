import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
    'name',
    'coverImg',
    'address',
]) {
    @Field((type) => String)
    categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}

// InputType을 통한 통합형 (하나의 오브젝트 argument 처리)
// @InputType()
// export class createRestaurantDto {
//     @Field((type) => String)
//     name: string;
//     @Field((type) => Boolean)
//     isBeef: boolean;
//     @Field((type) => String)
//     address: string;
//     @Field((type) => String)
//     ownerName: string;
// }

// ArgsType을 통한 분리형 (분리된 오브젝트 argument 처리)
// @ArgsType()
// export class CreateRestaurantDto {
//     @Field((type) => String)
//     @IsString()
//     @Length(3, 10)
//     name: string;

//     @Field((type) => Boolean)
//     @IsBoolean()
//     isBeef: boolean;

//     @Field((type) => String)
//     @IsString()
//     address: string;

//     @Field((type) => String)
//     @IsString()
//     ownerName: string;
// }
// InputType을 통한 Mapped Type
// Restaurant entity는 ObjectType이므로 InputType으로 변환

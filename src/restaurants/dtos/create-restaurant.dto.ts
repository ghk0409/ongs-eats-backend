import { ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';
import { Restaurant } from '../entities/restaurant.entity';

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
@InputType()
export class CreateRestaurantDto extends OmitType(
    Restaurant,
    ['id'],
    InputType,
) {}

import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

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
@ArgsType()
export class createRestaurantDto {
    @Field((type) => String)
    @IsString()
    @Length(3, 10)
    name: string;

    @Field((type) => Boolean)
    @IsBoolean()
    isBeef: boolean;

    @Field((type) => String)
    @IsString()
    address: string;

    @Field((type) => String)
    @IsString()
    ownerName: string;
}

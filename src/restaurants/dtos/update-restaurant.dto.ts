import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

// PartialType을 통해 각 데이터 옵션 분리화
@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantDto) {}

// id를 받아서 처리하는 DTO 설정
@InputType()
export class UpdateRestaurantDto {
    @Field((type) => Number)
    id: number;

    @Field((type) => UpdateRestaurantInputType)
    data: UpdateRestaurantInputType;
}

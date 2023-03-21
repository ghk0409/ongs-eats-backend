import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
    // 필수 필드
    @Field((type) => String)
    name: string;

    // 옵션 필드
    @Field((type) => Boolean)
    isBeef: boolean;

    @Field((type) => String)
    address: string;

    @Field((type) => String)
    ownerName: string;
}

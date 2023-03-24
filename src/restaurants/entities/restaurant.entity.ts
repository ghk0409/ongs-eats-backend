import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// GraphQL ObjectType 데코레이터 및 DB 테이블 매핑용 Entity 데코레이터
// isAbstarct true이면 추상화로 인해 스키마에 포함되지 않음(동시에 2개 타입 설정이 불가하기에 추상화로 확장시키는 것)
// @InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
    // DB primay key column
    @PrimaryGeneratedColumn()
    @Field((type) => Number)
    id: number;

    // GraphQL 필드 및 DB 테이블 컬럼 데코레이터
    @Field((type) => String) // GraphQL
    @Column()
    @IsString()
    @Length(3, 10)
    name: string;

    @Field((type) => Boolean, { defaultValue: true }) // GraphQL 스키마에서 해당 필드 default 설정
    @Column({ default: true }) // DB 테이블 해당 컬럼 default 설정
    @IsOptional() // 해당 필드 옵션 처리
    @IsBoolean()
    isBeef: boolean;

    @Field((type) => String, { defaultValue: 'Daejeon' })
    @Column({ default: 'Daejeon' })
    @IsString()
    address: string;

    @Field((type) => String, { nullable: true, defaultValue: 'no owner' })
    @Column()
    @IsString()
    ownerName: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsOptional()
    @IsString()
    categoryName: string;
}

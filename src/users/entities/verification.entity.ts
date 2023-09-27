import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
    // 이메일 인증을 위한 코드값
    @Column()
    @Field((type) => String)
    code: string;

    // User와 Verification은 1:1 관계
    // Verification에서 User로 접근
    @OneToOne((type) => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    // 랜덤 코드 생성
    @BeforeInsert()
    createCode(): void {
        // Math.random을 이용한 랜덤 코드 생성
        // this.code = Math.random().toString(36).substring(2);
        // uuid를 이용한 랜덤 코드 생성
        this.code = uuidv4().replace(/-/g, '');
    }
}

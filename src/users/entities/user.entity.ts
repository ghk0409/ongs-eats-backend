import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsEnum, IsString } from 'class-validator';

// user role 타입 지정
// type UserRole = 'client' | 'owner' | 'delivery';
// enum type으로 user role 지정
enum UserRole {
    Client,
    Owenr,
    Delivery,
}
// GraphQL에도 enum 타입 지정
registerEnumType(UserRole, { name: 'UserRole' });

// DB Entity 및 GraphQL 설정
@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
    @Column()
    @Field((type) => String)
    @IsEmail() // email 유효성 검증
    email: string;

    @Column()
    @Field((type) => String)
    @IsString() // password 유효성 검증
    password: string;

    @Column({ type: 'enum', enum: UserRole })
    @Field((type) => UserRole)
    @IsEnum(UserRole) // UserRole enum 유효성 검증
    role: UserRole;

    // Listener

    // 패스워드 해싱 메서드
    // User Entity가 DB insert(users.save) 되기 전에 실행
    @BeforeInsert()
    async hashPassword(): Promise<void> {
        try {
            // hash(this.password)의 password는 users.create() 되었을 때 받은 password 값임
            this.password = await bcrypt.hash(this.password, 10);
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }

    // 패스워드 일치 여부 검사 메서드
    async checkPassword(aPassword: string): Promise<boolean> {
        try {
            // this.password는 서비스에서 findOne으로 찾은 user의 password!!
            const ok = await bcrypt.compare(aPassword, this.password);
            return ok;
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }
}

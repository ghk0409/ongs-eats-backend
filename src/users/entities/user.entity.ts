import { InternalServerErrorException } from '@nestjs/common';
import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';

// user role 타입 지정
// type UserRole = 'client' | 'owner' | 'delivery';
// enum type으로 user role 지정
export enum UserRole {
    Client = 'Client',
    Owner = 'Owner',
    Delivery = 'Delivery',
}
// GraphQL에도 enum 타입 지정
registerEnumType(UserRole, { name: 'UserRole' });

// DB Entity 및 GraphQL 설정
@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
    @Column({ unique: true }) // 이메일은 unique
    @Field((type) => String)
    @IsEmail() // email 유효성 검증
    email: string;

    @Column({ select: false }) // select: false => DB에서 select하지 않음 (relation으로 User 개체 가져올 때 password는 가져오지 않음)
    @Field((type) => String)
    @IsString() // password 유효성 검증
    password: string;

    @Column({ type: 'enum', enum: UserRole })
    @Field((type) => UserRole)
    @IsEnum(UserRole) // UserRole enum 유효성 검증
    role: UserRole;

    // email 인증 여부
    @Column({ default: false })
    @Field((type) => Boolean)
    @IsBoolean()
    verified: boolean;

    // User Entity와 Restaurant Entity의 관계 설정
    @Field((type) => [Restaurant])
    @OneToMany((type) => Restaurant, (restaurant) => restaurant.owner)
    restaurants: Restaurant[];

    // User Entity와 Order Entity의 관계 설정(customer에게 보이는 주문 목록)
    @Field((type) => [Order])
    @OneToMany((type) => Order, (order) => order.customer)
    orders: Order[];

    // User Entity와 Order Entity의 관계 설정(driver에게 보이는 주문 목록)
    @Field((type) => [Order])
    @OneToMany((type) => Order, (order) => order.driver)
    rides: Order[];

    // Listener

    // 패스워드 해싱 메서드
    // User Entity가 DB insert(users.save) | update 되기 전에 실행
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        // password가 있을 때만 해싱
        if (this.password) {
            try {
                // hash(this.password)의 password는 users.create() 되었을 때 받은 password 값임
                this.password = await bcrypt.hash(this.password, 10);
            } catch (e) {
                console.log(e);
                throw new InternalServerErrorException();
            }
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

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly users: Repository<User>,
    ) {}

    // 유저 생성 - 정상: undefined, 에러: string 반환
    // error가 있을 때 return 하도록 하는 에러 처리(내가 에러를 직접 다룰 수 있음)
    async createAccount({
        email,
        password,
        role,
    }: CreateAccountInput): Promise<string | undefined> {
        // check new user
        try {
            const exists = await this.users.findOne({ where: { email } });
            if (exists) {
                // make error
                return '이미 존재하는 이메일입니다. 다시 확인해주세요!';
            }
            // create user
            await this.users.save(this.users.create({ email, password, role }));
        } catch (e) {
            // make error
            console.log(e);
            return '계정을 만들 수 없습니다:(';
        }
        // create user & hash the password
    }
}

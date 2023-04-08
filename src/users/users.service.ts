import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly users: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    // 회원가입 - Object return { ok: 성공여부, error: 실패 시 에러 메시지 }
    // error가 있을 때 return 하도록 하는 에러 처리(내가 에러를 직접 다룰 수 있음)
    async createAccount({
        email,
        password,
        role,
    }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
        // check new user
        try {
            const exists = await this.users.findOne({ where: { email } });
            if (exists) {
                // make error
                return {
                    ok: false,
                    error: '이미 존재하는 이메일입니다. 다시 확인해주세요!',
                };
            }
            // create user
            await this.users.save(this.users.create({ email, password, role }));
            return { ok: true };
        } catch (e) {
            // make error
            return { ok: false, error: '계정을 만들 수 없습니다:(' };
        }
    }

    // 로그인 -
    async login({
        email,
        password,
    }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
        try {
            // 1. find the user with the email
            const user = await this.users.findOne({ where: { email } });
            // user 없을  경우
            if (!user) {
                return {
                    ok: false,
                    error: '해당 이메일이 존재하지 않습니다. 다시 한 번 확인해주세요^^',
                };
            }
            // 2. chect if the password is correct
            // users는 User entity로부터 가져온 레포지토리, 해당 레포지토리(users)로부터 받아온 user는 User 객체 인스턴스이므로 User 클래스 메서드를 지님
            const passwordCheck = await user.checkPassword(password);
            if (!passwordCheck) {
                return {
                    ok: false,
                    error: '비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요^^',
                };
            }
            // 3. make a JWT and give it to the user
            // const token = this.jwtService.normalSign({ id: user.id });
            const token = this.jwtService.specificSign(user.id);

            return {
                ok: true,
                token,
            };
        } catch (error) {
            return {
                ok: false,
                error,
            };
        }
    }

    // 사용자 ID 검색
    async findById(id: number): Promise<User> {
        return this.users.findOne({ where: { id } });
    }
}

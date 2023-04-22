import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CreateAccountInput,
    CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifiyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { LoginOutput } from './dtos/login.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly users: Repository<User>,
        @InjectRepository(Verification)
        private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) {}

    // 회원가입 - Object return { ok: 성공여부, error: 실패 시 에러 메시지 }
    // error가 있을 때 return 하도록 하는 에러 처리(내가 에러를 직접 다룰 수 있음)
    async createAccount({
        email,
        password,
        role,
    }: CreateAccountInput): Promise<CreateAccountOutput> {
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
            const user = await this.users.save(
                this.users.create({ email, password, role }),
            );
            // create verification
            const verification = await this.verifications.save(
                this.verifications.create({ user }),
            );

            // send email
            this.mailService.sendVerificationEmail(
                user.email,
                verification.code,
            );

            return { ok: true };
        } catch (e) {
            // make error
            return { ok: false, error: '계정을 만들 수 없습니다:(' };
        }
    }

    // 로그인 -
    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        try {
            // 1. find the user with the email
            const user = await this.users.findOne({
                where: { email },
                // 기본적으로 password가 select 되지 않으므로 select 해줘야 함
                // select로 특정 컬럼만 가져오기 때문에 user.id 값도 같이 가져와야 함!(jwt 토큰 생성 시 필요)
                select: ['id', 'password'],
            });
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
    async findById(id: number): Promise<UserProfileOutput> {
        try {
            // findOneOrFail()은 해당 데이터가 없을 경우 에러를 발생시킴
            const user = await this.users.findOneOrFail({ where: { id } });
            // findOneorFail을 사용함으로써 없을 경우 에러를 발생시키므로 if (user) 필요 없음
            return {
                ok: true,
                user,
            };
        } catch (error) {
            return { ok: false, error: '사용자를 찾을 수 없습니다.' };
        }
    }

    // 사용자 프로필 수정
    async editProfile(
        userId: number,
        { email, password }: EditProfileInput,
    ): Promise<EditProfileOutput> {
        try {
            // 로그인 상태에서만 프로필 수정이 가능하기 때문에 update()만 바로 사용
            const user = await this.users.findOne({ where: { id: userId } });
            // 이메일 있는 경우
            if (email) {
                user.email = email;
                user.verified = false;
                // create verification
                const verification = await this.verifications.save(
                    this.verifications.create({ user }),
                );

                // send email
                this.mailService.sendVerificationEmail(
                    user.email,
                    verification.code,
                );
            }
            // 패스워드 있는 경우
            if (password) {
                user.password = password;
            }

            // @BeforeUpdate hook을 사용하기 위해 save() 사용
            // update()는 해당 데이터 유무에 상관없이 update를 수행
            await this.users.save(user);
            return { ok: true };
            // return this.users.update(userId, { email, password });
        } catch (error) {
            return { ok: false, error: '프로필을 수정할 수 없습니다.' };
        }
    }

    // 이메일 인증
    async verifyEmail(code: string): Promise<VerifiyEmailOutput> {
        try {
            // verification code로 verification entity 찾기
            const verification = await this.verifications.findOne({
                where: { code },
                // loadRelationIds: true, // relation id만 가져오기
                relations: ['user'], // relation entity까지 가져오기
            });

            if (verification) {
                // 해당 verification의 user의 verified를 true로 변경 후 저장
                verification.user.verified = true;
                // @BeforeUpdate hook을 사용하기 위해 save() 사용
                this.users.save(verification.user);
                // @BeforeUpdate hook을 사용하지 않을 경우 update() 사용
                // this.users.update(verification.user.id, { verified: true });

                // verification entity 삭제
                await this.verifications.delete(verification.id);

                return { ok: true };
            }
            return { ok: false, error: '인증 코드가 유효하지 않습니다.' };
        } catch (error) {
            return { ok: false, error };
        }
    }
}

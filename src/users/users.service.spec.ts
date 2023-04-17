import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

// Mocking 함수 만들기 (테스트용으로 사용될 가짜)
const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
};

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
};

const mockMailService = {
    sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: MockRepository<User>;

    // 모든 테스트가 실행되기 전에 실행되는 함수
    // 테스트 모듈 생성
    beforeAll(async () => {
        const modules = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
            ],
        }).compile();

        service = modules.get<UsersService>(UsersService);
        usersRepository = modules.get(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAccount', () => {
        it('should fail if user exists', async () => {
            // 실제 DB에 접속하지 않고 findOne 함수를 가로채서 해당 함수 실행 결과를 가짜로 만들어줌
            // 여기서는 이미 존재하는 이메일이라는 가짜 결과를 만들어줌
            usersRepository.findOne.mockResolvedValue({
                id: 1,
                email: 'test@test.com',
            });
            const result = await service.createAccount({
                email: '',
                password: '',
                role: 0,
            });
            expect(result).toMatchObject({
                ok: false,
                error: '이미 존재하는 이메일입니다. 다시 확인해주세요!',
            });
        });
    });

    it.todo('login');
    it.todo('findById');
    it.todo('editProfile');
    it.todo('verifyEmail');
});

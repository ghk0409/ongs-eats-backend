import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

// Mocking 함수 만들기 (테스트용으로 사용될 가짜)
// repository가 2개라서 서로 다른 함수임을 명시하기 위해 함수로 만들어 사용
const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
});

const mockJwtService = {
    specificSign: jest.fn(() => 'signed-token-baby'),
    verify: jest.fn(),
};

const mockMailService = {
    sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: MockRepository<User>;
    let verificationRepository: MockRepository<Verification>;
    let mailService: MailService;
    let jwtService: JwtService;

    // 모든 테스트가 실행되기 전에 실행되는 함수
    // 테스트 모듈 생성
    beforeEach(async () => {
        const modules = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository(),
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
        mailService = modules.get<MailService>(MailService);
        jwtService = modules.get<JwtService>(JwtService);
        usersRepository = modules.get(getRepositoryToken(User));
        verificationRepository = modules.get(getRepositoryToken(Verification));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAccount', () => {
        const createAccountArgs = {
            email: '',
            password: '',
            role: 0,
        };

        it('should fail if user exists', async () => {
            // 실제 DB에 접속하지 않고 findOne 함수를 가로채서 해당 함수 실행 결과를 가짜로 만들어줌
            // 여기서는 이미 존재하는 이메일이라는 가짜 결과를 만들어줌
            usersRepository.findOne.mockResolvedValue({
                id: 1,
                email: 'test@test.com',
            });
            const result = await service.createAccount(createAccountArgs);
            expect(result).toMatchObject({
                ok: false,
                error: '이미 존재하는 이메일입니다. 다시 확인해주세요!',
            });
        });

        it('should create a new user', async () => {
            // findOne 함수가 실행되었을 때 undefined를 return 하도록 가짜로 만들어줌
            usersRepository.findOne.mockResolvedValue(undefined);
            // usersRepository의 create, save 함수가 실행되었을 때 createAccountArgs를 return 하도록 가짜로 만들어줌
            usersRepository.create.mockReturnValue(createAccountArgs);
            usersRepository.save.mockResolvedValue(createAccountArgs);
            // verificationRepository의 create, save 함수가 실행되었을 때 createAccountArgs를 return 하도록 가짜로 만들어줌
            verificationRepository.create.mockReturnValue({
                user: createAccountArgs,
            });
            verificationRepository.save.mockResolvedValue({ code: 'code' });

            const result = await service.createAccount(createAccountArgs);
            // create 함수가 한 번 실행되었는지와 받은 args 확인
            expect(usersRepository.create).toHaveBeenCalledTimes(1);
            expect(usersRepository.create).toHaveBeenCalledWith(
                createAccountArgs,
            );
            // save 함수가 한 번 실행되었는지와 받은 args 확인
            expect(usersRepository.save).toHaveBeenCalledTimes(1);
            expect(usersRepository.save).toHaveBeenCalledWith(
                createAccountArgs,
            );
            // verificationRepository.create 함수가 한 번 실행되었는지와 받은 args 확인
            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({
                user: createAccountArgs,
            });
            // verificationRepository.save 함수가 한 번 실행되었는지와 받은 args 확인
            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith({
                user: createAccountArgs,
            });

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
            );

            expect(result).toEqual({ ok: true });
        });

        it('should fail on exception', async () => {
            usersRepository.findOne.mockRejectedValue(new Error());
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({
                ok: false,
                error: '계정을 만들 수 없습니다:(',
            });
        });
    });

    describe('login', () => {
        const loginArgs = {
            email: 'test@test.com',
            password: '123123',
        };

        it('should fail if user does not exist', async () => {
            usersRepository.findOne.mockResolvedValue(undefined);
            const result = await service.login(loginArgs);

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
            // expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Ob));
            expect(result).toEqual({
                ok: false,
                error: '해당 이메일이 존재하지 않습니다. 다시 한 번 확인해주세요^^',
            });
        });

        it('should fail if the password is wrong', async () => {
            const mockedUser = {
                checkPassword: jest.fn(() => Promise.resolve(false)),
            };
            usersRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);

            expect(result).toEqual({
                ok: false,
                error: '비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요^^',
            });
        });

        it('should return token if password correct', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(true)),
            };
            usersRepository.findOne.mockResolvedValue(mockedUser);

            const result = await service.login(loginArgs);

            expect(jwtService.specificSign).toHaveBeenCalledTimes(1);
            expect(jwtService.specificSign).toHaveBeenCalledWith(
                expect.any(Number),
            );

            expect(result).toEqual({
                ok: true,
                token: 'signed-token-baby',
            });
        });

        it('should fail on exception', async () => {
            usersRepository.findOne.mockRejectedValue(new Error());
            const result = await service.login(loginArgs);

            expect(result).toEqual({
                ok: false,
                error: expect.any(Error),
            });
        });
    });

    describe('findById', () => {
        const findByIdArgs = {
            id: 1,
        };

        it('should find an existing user', async () => {
            usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
            const result = await service.findById(1);

            expect(result).toEqual({ ok: true, user: findByIdArgs });
        });

        it('should fail if no user if found', async () => {
            usersRepository.findOneOrFail.mockRejectedValue(new Error());
            const result = await service.findById(1);

            expect(result).toEqual({
                ok: false,
                error: '사용자를 찾을 수 없습니다.',
            });
        });
    });

    // describe('editProfile', () => {});

    it.todo('verifyEmail');
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../src/app.module';

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
    email: 'news@account.com',
    password: 123123,
};

// 실제 인증 메일 전송을 하지 않고 테스트를 하기 위해 mock을 사용
jest.mock('got', () => {
    return {
        post: jest.fn(),
    };
});

describe('UserModule (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let jwtToken: string;
    let usersRepository: Repository<User>;
    let verificationRepository: Repository<Verification>;

    // 테스트를 위한 기본적인 request 함수
    const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
    // baseTest를 기반으로 public/private 테스트 함수
    const publicTest = (query: string) => baseTest().send({ query });
    const privateTest = (query: string) =>
        baseTest().set('x_token', jwtToken).send({ query });

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        dataSource = module.get<DataSource>(DataSource);
        // 레포지토리 토큰을 이용해 레포지토리를 가져옴
        usersRepository = module.get<Repository<User>>(
            getRepositoryToken(User),
        );
        verificationRepository = module.get<Repository<Verification>>(
            getRepositoryToken(Verification),
        );
        await app.init();
    });

    afterAll(async () => {
        // 모든 테스트 종료 후 DB drop 후 connection 종료
        await dataSource.dropDatabase();
        await dataSource.destroy();

        // 모든 테스트 종료 후 app 종료
        app.close();
    });

    describe('createAccount', () => {
        it('should create account', () => {
            return publicTest(`
                    mutation {
                        createAccount(input: {
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                            role:Client
                        }) {
                            ok
                            error
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    // res 결과에 대한 응답 검증
                    expect(res.body.data.createAccount.ok).toBe(true);
                    expect(res.body.data.createAccount.error).toBe(null);
                });
        });

        it('sould fail if account already exists', () => {
            return publicTest(`
                    mutation {
                        createAccount(input: {
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                            role:Client
                        }) {
                            ok
                            error
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                createAccount: { ok, error },
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe(
                        '이미 존재하는 이메일입니다. 다시 확인해주세요!',
                    );
                });
        });
    });

    describe('login', () => {
        it('should login with correct credentials', () => {
            return publicTest(`
                    mutation {
                        login(input: {
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                        }) {
                            ok
                            error
                            token
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                login: { ok, error, token },
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                    expect(token).toEqual(expect.any(String));
                    jwtToken = token;
                });
        });

        it('should not be able to login with wrong credentials', () => {
            return publicTest(`
                    mutation {
                        login(input: {
                            email:"${testUser.email}",
                            password:"nonononono",
                        }) {
                            ok
                            error
                            token
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                login: { ok, error, token },
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe(
                        '비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요^^',
                    );
                    expect(token).toBe(null);
                });
        });
    });

    describe('userProfile', () => {
        let userId: number;

        // 테스트 전에 위에서 생성된 유저 데이터 가져오기
        beforeAll(async () => {
            const [user] = await usersRepository.find();
            userId = user.id;
        });

        it("should see a user's profile", () => {
            return privateTest(`
                    {
                        userProfile(userId: ${userId}) {
                            ok
                            error
                            user {
                            id
                            }
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: {
                                    ok,
                                    error,
                                    user: { id },
                                },
                            },
                        },
                    } = res;

                    expect(ok).toBeTruthy();
                    expect(error).toBeNull();
                    expect(id).toBe(userId);
                });
        });

        it('should not find a profile', () => {
            return privateTest(`
                    {
                        userProfile(userId: 222) {
                            ok
                            error
                            user {
                            id
                            }
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: { ok, error, user },
                            },
                        },
                    } = res;

                    expect(ok).toBeFalsy();
                    expect(error).toBe('사용자를 찾을 수 없습니다.');
                    expect(user).toBeNull();
                });
        });
    });

    describe('me', () => {
        it('should find my profile', () => {
            return privateTest(`
                {
                    me {
                        email
                    }
                }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                me: { email },
                            },
                        },
                    } = res;

                    expect(email).toBe(testUser.email);
                });
        });

        it('should not allow logged out user', () => {
            return publicTest(`
                {
                    me {
                        email
                    }
                }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data,
                            errors: [error],
                        },
                    } = res;

                    expect(data).toBeNull();
                    expect(error.message).toBe('Forbidden resource');
                });
        });
    });

    describe('editProfile', () => {
        const NEW_EMAIL = 'new@ongs.com';

        it('should change email', () => {
            return privateTest(`
                    mutation {
                        editProfile(input: {
                            email: "${NEW_EMAIL}"
                        }) {
                            ok
                            error
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                editProfile: { ok, error },
                            },
                        },
                    } = res;

                    expect(ok).toBeTruthy();
                    expect(error).toBeNull();
                });
        });

        it('should check email', () => {
            return privateTest(`
                {
                    me {
                        email
                    }
                }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                me: { email },
                            },
                        },
                    } = res;

                    expect(email).toBe(NEW_EMAIL);
                });
        });
    });

    describe('verifyEmail', () => {
        let verificationCode: string;

        beforeAll(async () => {
            const [verification] = await verificationRepository.find();
            verificationCode = verification.code;
        });

        // 이메일 인증 후 해당 verification을 삭제해버리기 때문에 에러의 경우를 먼저 테스트
        it('should fail on wrong verification code', () => {
            return publicTest(`
                    mutation {
                        verifyEmail(input: { code: "3uz#feija09#" }) {
                            ok
                            error
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                verifyEmail: { ok, error },
                            },
                        },
                    } = res;

                    expect(ok).toBe(false);
                    expect(error).toBe('인증 코드가 유효하지 않습니다.');
                });
        });

        it('should verify email', () => {
            return publicTest(`
                    mutation {
                        verifyEmail(input: { code: "${verificationCode}" }) {
                            ok
                            error
                        }
                    }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                verifyEmail: { ok, error },
                            },
                        },
                    } = res;

                    expect(ok).toBe(true);
                    expect(error).toBeNull();
                });
        });
    });
});

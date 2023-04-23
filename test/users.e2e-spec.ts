import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import exp from 'constants';

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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
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
                    `,
                })
                .expect(200)
                .expect((res) => {
                    // res 결과에 대한 응답 검증
                    expect(res.body.data.createAccount.ok).toBe(true);
                    expect(res.body.data.createAccount.error).toBe(null);
                });
        });

        it('sould fail if account already exists', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
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
                    `,
                })
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
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
                    `,
                })
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
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
                    `,
                })
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        {
                            userProfile(userId: ${userId}) {
                                ok
                                error
                                user {
                                id
                                }
                            }
                        }
                    `,
                })
                .set('x_token', jwtToken) // 헤더 설정
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                    {
                        userProfile(userId: 222) {
                            ok
                            error
                            user {
                            id
                            }
                        }
                    }
                `,
                })
                .set('x_token', jwtToken) // 헤더 설정
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                    {
                        me {
                            email
                        }
                    }
                    `,
                })
                .set('x_token', jwtToken)
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
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                    {
                        me {
                            email
                        }
                    }
                    `,
                })
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

    it.todo('editProfile');

    it.todo('verifyEmail');
});

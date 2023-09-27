import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

import { JwtService } from './jwt.service';

const TEST_KEY = 'testKey';
const USER_ID = 111;

// 외부 라이브러리 mocking (jwt모듈)
// 실제 모듈을 사용하지 않고, 테스트를 위한 가짜 모듈을 만들어서 사용 - 테스트의 목적은 기능별 동작을 검증하는 것
jest.mock('jsonwebtoken', () => {
    return {
        sign: jest.fn(() => 'TOKEN'),
        verify: jest.fn(() => ({ id: USER_ID })),
    };
});

describe('JwtService', () => {
    let service: JwtService;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                JwtService,
                {
                    provide: CONFIG_OPTIONS,
                    useValue: {
                        privateKey: TEST_KEY,
                    },
                },
            ],
        }).compile();

        service = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sign', () => {
        it('should return a signed token', () => {
            const ID = 1;
            const token = service.specificSign(ID);

            // token이 string인지 검증
            expect(typeof token).toBe('string');

            // jwt 모듈이 위에서 mocking 되었기 때문에, 실제 모듈을 호출했지만 가짜 모듈이 사용됨
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledWith({ id: ID }, TEST_KEY);
        });
    });

    describe('verify', () => {
        it('should return the decoded', () => {
            const TOKEN = 'TOKEN';
            const decodedToken = service.verify(TOKEN);

            expect(decodedToken).toEqual({ id: USER_ID });

            expect(jwt.verify).toHaveBeenCalledTimes(1);
            expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
        });
    });
});

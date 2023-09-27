import { Test } from '@nestjs/testing';
import * as FormData from 'form-data';
import got from 'got';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

import { MailService } from './mail.service';

const API_KEY = 'test-apiKey';
const DOMAIN = 'test-domain';
const FROM_EMAIL = 'test-fromEmail';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
    let service: MailService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: CONFIG_OPTIONS,
                    useValue: {
                        apiKey: API_KEY,
                        domain: DOMAIN,
                        fromEmail: FROM_EMAIL,
                    },
                },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('should call sendEmail', () => {
            const sendVerificationEmailArgs = {
                email: 'email',
                code: 'code',
            };

            // sendEmail 메서드의 실제 실행을 검사하기 위해 mock가 아닌 spyOn 사용
            // sendVerificationEmail을 실행하면 내부에서 sendEmail이 실행되는데, 이를 검증하기 위해 spyOn 사용(중간에 가로채기)
            jest.spyOn(service, 'sendEmail').mockImplementation(
                async () => true,
            );

            service.sendVerificationEmail(
                sendVerificationEmailArgs.email,
                sendVerificationEmailArgs.code,
            );

            // sendEmail 호출되었는지 검증
            // 아래 값들을 가지고 호출되었는지 검증
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith(
                '이메일 본인 인증',
                'test-template',
                'zzangwlghd@naver.com',
                [
                    { key: 'code', value: sendVerificationEmailArgs.code },
                    { key: 'username', value: sendVerificationEmailArgs.email },
                ],
            );
        });
    });

    describe('sendEmail', () => {
        it('sends email', async () => {
            const result = await service.sendEmail('', '', '', [
                { key: 'one', value: '1' },
            ]);

            const formSpy = jest.spyOn(FormData.prototype, 'append');

            // FormData의 append 메서드가 여러 번 호출되기 때문에 호출 되는지만 검증
            expect(formSpy).toHaveBeenCalled();
            // got 메서드 호출 시, URL(String), options(Object)를 인자로 받는지 검증
            expect(got.post).toHaveBeenCalledTimes(1);
            expect(got.post).toHaveBeenLastCalledWith(
                `https://api.mailgun.net/v3/${DOMAIN}/messages`,
                expect.any(Object),
            );
            // result 값 검증
            // expect(result).toEqual(true);
            expect(result).toBeTruthy();
        });

        it('fails on error', async () => {
            jest.spyOn(got, 'post').mockImplementation(() => {
                throw new Error('got error');
            });

            const result = await service.sendEmail('', '', '', []);

            // expect(result).toEqual(false);
            expect(result).toBeFalsy();
        });
    });
});

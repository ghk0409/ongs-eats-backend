import { Inject, Injectable } from '@nestjs/common';
import { EmailVar, MailModuleOption } from './mail.interfaces';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import got from 'got';
import * as FormData from 'form-data';

@Injectable()
export class MailService {
    constructor(
        // Global인 ConfigService를 가져와서 사용하는게 깔끔
        @Inject(CONFIG_OPTIONS) private readonly mailOptions: MailModuleOption,
    ) {}

    // 이메일 전송 메서드 (private 메서드는 테스트 불가능으로 테스트할 때는 public으로 변경)
    async sendEmail(
        subject: string,
        template: string,
        to: string,
        emailVars: EmailVar[],
    ): Promise<boolean> {
        // Mailgun API를 사용하기 위한 form-data 생성
        const form = new FormData();
        form.append('from', `OngsEats <${this.mailOptions.fromEmail}>`);
        form.append('to', to);
        form.append('subject', subject);
        form.append('template', template);
        emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

        try {
            await got.post(
                `https://api.mailgun.net/v3/${this.mailOptions.domain}/messages`,
                {
                    // method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `api:${this.mailOptions.apiKey}`,
                        ).toString('base64')}`,
                    },
                    body: form,
                },
            );

            return true;
        } catch (error) {
            // quite error handling: 보통 이메일의 경우 에러가 발생해도 사용자에게 에러를 보여주지 않는다.
            return false;
        }
    }

    sendVerificationEmail(email: string, code: string) {
        this.sendEmail(
            '이메일 본인 인증',
            'test-template',
            'zzangwlghd@naver.com',
            [
                { key: 'code', value: code },
                { key: 'username', value: email },
            ],
        );
    }
}

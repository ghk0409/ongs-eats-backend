import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOption } from './mail.interfaces';
import { MailService } from './mail.service';

// 이메일 모듈 글로벌 설정 추가
@Module({})
@Global()
export class MailModule {
    static forRoot(options: MailModuleOption): DynamicModule {
        return {
            module: MailModule,
            exports: [MailService],
            providers: [
                { provide: CONFIG_OPTIONS, useValue: options },
                MailService,
            ],
        };
    }
}

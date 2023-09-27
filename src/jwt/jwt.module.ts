import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Module({})
@Global()
export class JwtModule {
    // 커스터마이징을 위한 forRoot 메서드
    // DynamicModule은 또 다른 module을 반환하는 것뿐임
    static forRoot(options: JwtModuleOptions): DynamicModule {
        return {
            // return할 모듈
            module: JwtModule,
            exports: [JwtService],
            providers: [
                { provide: CONFIG_OPTIONS, useValue: options },
                JwtService,
            ],
        };
    }
}

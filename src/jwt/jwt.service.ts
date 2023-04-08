import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import * as jwt from 'jsonwebtoken';
// import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
    constructor(
        // Global인 ConfigService를 가져와서 사용하는게 깔끔
        // private readonly configService: ConfigService,
        // 'options'명의 값 주입
        @Inject(CONFIG_OPTIONS) private readonly jwtOptions: JwtModuleOptions,
    ) {}
    // 범용성 token 생성 메서드
    normalSign(payload: object): string {
        return jwt.sign(payload, this.jwtOptions.privateKey);
        // return jwt.sign(payload, this.configService.get('PRIVATE_KEY'));
    }

    // 해당 프로젝트 특정 token 생성 메서드
    specificSign(userId: number): string {
        return jwt.sign({ id: userId }, this.jwtOptions.privateKey);
        // return jwt.sign(payload, this.configService.get('PRIVATE_KEY'));
    }

    // 토큰 검증 메서드
    verify(token: string) {
        return jwt.verify(token, this.jwtOptions.privateKey);
    }
}

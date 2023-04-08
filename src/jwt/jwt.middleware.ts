import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';

// 클래스 형태 middleware
@Injectable()
export class JwtMiddleware implements NestMiddleware {
    // @Injectable()인 경우에만 inject 가능
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
    ) {}
    async use(req: Request, res: Response, next: NextFunction) {
        if ('x_token' in req.headers) {
            const token = req.headers['x_token'];
            const decoded = this.jwtService.verify(token.toString());

            if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
                console.log(decoded);
                try {
                    const user = await this.userService.findById(decoded['id']);
                    req['user'] = user;
                } catch (e) {
                    console.log(e);
                }
            }
        }
        next();
    }
}

// 함수 형태 middleware
// export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
//     console.log(req.headers);
//     next();
// }

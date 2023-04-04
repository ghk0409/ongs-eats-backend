import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// 클래스 형태 middleware
// export class JwtMiddleware implements NestMiddleware {
//     use(req: Request, res: Response, next: NextFunction) {
//         console.log(req.headers);
//         next();
//     }
// }

// 함수 형태 middleware
export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log(req.headers);
    next();
}

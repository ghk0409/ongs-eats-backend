import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';

import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // role을 가져오기 위해 reflector 사용
        const roles = this.reflector.get<AllowedRoles>(
            'roles',
            context.getHandler(),
        );

        // role이 없으면 true (public resolver)
        if (!roles) {
            return true;
        }

        // 기본 context는 http context, gpl용 context로 변경
        const gqlContext = GqlExecutionContext.create(context).getContext();
        // context에서 token 가져오기
        const token = gqlContext.token;

        if (token) {
            const decoded = this.jwtService.verify(token.toString());

            if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
                const { user } = await this.userService.findById(decoded['id']);
                // role이 없으면 false (private resolver)
                // user가 있어야 하는 resolver에 비로그인 상태로 접근할 경우 false
                if (!user) {
                    return false;
                }

                // GraphQL context에 user 추가
                gqlContext['user'] = user;

                // Any일 경우에 true (user.role에는 Any 없음)
                // private resolver에서 모두 접근 가능한 resolver인 경우
                if (roles.includes('Any')) {
                    return true;
                }

                // roles에 해당 user의 role이 있는지 확인
                return roles.includes(user.role);
            } else {
                // token이 유효하지 않은 경우
                return false;
            }
        } else {
            return false;
        }
    }
}

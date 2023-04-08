import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        // 기본 context는 http context, gpl용 context로 변경
        const gqlContext = GqlExecutionContext.create(context).getContext();
        // gql context에서 user 가져오기
        const user = gqlContext['user'];
        if (!user) {
            return false;
        }
        return true;
    }
}

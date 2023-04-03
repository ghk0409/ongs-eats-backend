import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    CreateAccountInput,
    CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver((of) => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Query((returns) => Boolean)
    test() {
        return true;
    }

    // 회원가입 API
    @Mutation((returns) => CreateAccountOutput)
    async createAccount(
        @Args('input') createAccountInput: CreateAccountInput,
    ): Promise<CreateAccountOutput> {
        try {
            // object를 return 받아서 활용 (object또는 array 사용하면 깔끔)
            return this.usersService.createAccount(createAccountInput);
        } catch (error) {
            return {
                ok: false,
                error,
            };
        }
    }

    // 로그인 API
    @Mutation((returns) => LoginOutput)
    async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        try {
            return this.usersService.login(loginInput);
        } catch (error) {
            return {
                ok: false,
                error,
            };
        }
    }
}

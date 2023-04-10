import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    CreateAccountInput,
    CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
// import { AllExceptionFilter } from 'src/auth/auth.exception';

@Resolver((of) => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    // @UseFilters(new AllExceptionFilter())
    // 사용자 토큰 인증
    @Query((returns) => User)
    @UseGuards(AuthGuard)
    me(@AuthUser() authUser: User) {
        return authUser;
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

    // 사용자 프로필 조회
    @UseGuards(AuthGuard)
    @Query((returns) => UserProfileOutput)
    async userProfile(
        @Args() userProfileInput: UserProfileInput,
    ): Promise<UserProfileOutput> {
        try {
            // user를 찾아서 return
            const user = await this.usersService.findById(
                userProfileInput.userId,
            );
            // user가 없으면 error를 throw (catch로 이동)
            if (!user) {
                throw Error();
            }
            return {
                ok: true,
                user,
            };
            // return {
            //     ok: Boolean(user),
            //     user,
            //     error: user ? undefined : 'User Not Found',
            // };
        } catch (e) {
            return {
                error: 'User Not Found',
                ok: false,
            };
        }
    }

    // 사용자 프로필 수정
    @UseGuards(AuthGuard)
    @Mutation((returns) => EditProfileOutput)
    async editProfile(
        @AuthUser() authUser: User,
        @Args('input') editProfileInput: EditProfileInput,
    ): Promise<EditProfileOutput> {
        try {
            await this.usersService.editProfile(authUser.id, editProfileInput);
            return {
                ok: true,
            };
        } catch (e) {
            return {
                ok: false,
                error: 'Could not update profile',
            };
        }
    }
}

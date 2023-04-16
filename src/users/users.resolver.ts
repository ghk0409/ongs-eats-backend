import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    CreateAccountInput,
    CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifiyEmailOutput, VerifyEmailInput } from './dtos/verify-email.dto';
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
        return this.usersService.createAccount(createAccountInput);
    }

    // 로그인 API
    @Mutation((returns) => LoginOutput)
    async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        return this.usersService.login(loginInput);
    }

    // 사용자 프로필 조회
    @UseGuards(AuthGuard)
    @Query((returns) => UserProfileOutput)
    async userProfile(
        @Args() { userId }: UserProfileInput,
    ): Promise<UserProfileOutput> {
        return this.usersService.findById(userId);
    }

    // 사용자 프로필 수정
    @UseGuards(AuthGuard)
    @Mutation((returns) => EditProfileOutput)
    async editProfile(
        @AuthUser() authUser: User,
        @Args('input') editProfileInput: EditProfileInput,
    ): Promise<EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileInput);
    }

    // 이메일 인증 API
    @Mutation((returns) => VerifiyEmailOutput)
    async verifyEmail(
        @Args('input') { code }: VerifyEmailInput,
    ): Promise<VerifiyEmailOutput> {
        return this.usersService.verifyEmail(code);
    }
}

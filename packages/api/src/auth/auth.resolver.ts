import {Args, Context, Mutation, Query, Resolver} from '@nestjs/graphql';
import {UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {AuthService} from './auth.service';
import {LoginInput} from './dto/login.input';
import {RegisterInput} from './dto/register.input';
import {GqlAuthGuard} from './guards/gql-auth.guard';
import {CurrentUser} from './decorators/current-user.decorator';
import {User} from '../db/catalog/entities/user.entity';
import {AUTH_COOKIE_NAME} from './strategies/jwt.strategy';

interface GqlContext {
  res: Response;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => User)
  async register(
    @Args('input') input: RegisterInput,
    @Context() ctx: GqlContext,
  ): Promise<User> {
    const {accessToken, user} = await this.authService.register(input);
    this.setAuthCookie(ctx.res, accessToken);
    return user;
  }

  @Mutation(() => User)
  async login(
    @Args('input') input: LoginInput,
    @Context() ctx: GqlContext,
  ): Promise<User> {
    const {accessToken, user} = await this.authService.login(input);
    this.setAuthCookie(ctx.res, accessToken);
    return user;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  logout(@Context() ctx: GqlContext): boolean {
    ctx.res.clearCookie(AUTH_COOKIE_NAME);
    return true;
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}

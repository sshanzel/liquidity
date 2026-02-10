import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {GqlExecutionContext} from '@nestjs/graphql';
import {User} from '../../user/entities/user.entity';

export const CurrentUser = createParamDecorator((_, context: ExecutionContext): User => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user;
});

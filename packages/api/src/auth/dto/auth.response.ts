import {Field, ObjectType} from '@nestjs/graphql';
import {User} from '../../db/catalog/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}

import {Field, ID, InputType} from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field(() => ID)
  tenantId: string;

  @Field()
  username: string;

  @Field()
  password: string;

  @Field()
  taxId: string;
}

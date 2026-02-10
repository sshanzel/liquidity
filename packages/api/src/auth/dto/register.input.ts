import {Field, ID, InputType} from '@nestjs/graphql';
import {IsNotEmpty, IsUUID, MinLength} from 'class-validator';

@InputType()
export class RegisterInput {
  @Field(() => ID)
  @IsUUID()
  tenantId: string;

  @Field()
  @IsNotEmpty()
  username: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field()
  @IsNotEmpty()
  taxId: string;
}

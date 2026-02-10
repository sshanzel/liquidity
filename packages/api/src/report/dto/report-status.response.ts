import {Field, ID, ObjectType, registerEnumType} from '@nestjs/graphql';

export enum ReportStatusEnum {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

registerEnumType(ReportStatusEnum, {name: 'ReportStatusEnum'});

@ObjectType()
export class ReportStatusResponse {
  @Field(() => ID)
  id: string;

  @Field(() => ReportStatusEnum)
  status: ReportStatusEnum;
}

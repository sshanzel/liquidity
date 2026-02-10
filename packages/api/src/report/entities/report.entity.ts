import {Field, ID, ObjectType} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {ReportContent} from './report-content.entity';

@Entity('reports')
@ObjectType()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  tenantId: string;

  @Column()
  @Field()
  userId: string;

  @CreateDateColumn()
  @Field()
  startedAt: Date;

  @Column({type: 'timestamp', nullable: true})
  @Field({nullable: true})
  finishedAt: Date;

  @OneToMany(() => ReportContent, content => content.report)
  @Field(() => [ReportContent])
  contents: ReportContent[];
}

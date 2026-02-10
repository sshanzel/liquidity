import {Field, ID, ObjectType, registerEnumType} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {Report} from './report.entity';

export enum ReportStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

registerEnumType(ReportStatus, {name: 'ReportStatus'});

@Entity('report_contents')
@ObjectType()
export class ReportContent {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  reportId: string;

  @ManyToOne(() => Report, report => report.contents, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'reportId'})
  report: Report;

  @Column()
  @Field()
  source: string;

  @Column({type: 'enum', enum: ReportStatus, default: ReportStatus.IN_PROGRESS})
  @Field(() => ReportStatus)
  status: ReportStatus;

  @Column({type: 'text', nullable: true})
  @Field({nullable: true})
  data: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  lastRunAt: Date;
}

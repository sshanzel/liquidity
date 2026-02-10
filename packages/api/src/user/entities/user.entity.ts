import {Field, ID, ObjectType} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {Tenant} from '../../tenant/entities/tenant.entity';

@Entity('users')
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({name: 'tenantId'})
  @Field(() => Tenant)
  tenant: Tenant;

  @Column({unique: true})
  @Field()
  username: string;

  @Column()
  password: string;

  @Column()
  @Field()
  taxId: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}

import {Field, ID, ObjectType} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {User} from './user.entity';

@Entity('tenants')
@ObjectType()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @Column({nullable: true})
  @Field({nullable: true})
  description: string;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}

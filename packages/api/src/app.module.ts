import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {Request, Response} from 'express';
import {join} from 'path';
import {DbModule} from './db/db.module';
import {TenantModule} from './tenant/tenant.module';
import {UserModule} from './user/user.module';
import {AuthModule} from './auth/auth.module';
import {ReportModule} from './report/report.module';
import {PubSubModule} from './pubsub/pubsub.module';
import {TemporalModule} from './temporal/temporal.module';

interface GqlContext {
  req: Request;
  res: Response;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      playground: true,
      context: ({req, res}: GqlContext) => ({req, res}),
    }),
    TenantModule,
    UserModule,
    AuthModule,
    ReportModule,
    PubSubModule,
    TemporalModule,
  ],
})
export class AppModule {}

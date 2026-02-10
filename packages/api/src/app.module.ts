import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {ApolloServerPluginLandingPageGraphQLPlayground} from '@apollo/server-plugin-landing-page-graphql-playground';
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
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground({
          settings: {
            'request.credentials': 'include',
          },
          tabs: [
            {
              name: 'Login (user1 - t1)',
              endpoint: '/graphql',
              query: `mutation Login {
  login(input: {username: "user1", password: "password123"}) {
    id
  }
}`,
            },
            {
              name: 'Login (user2 - t2)',
              endpoint: '/graphql',
              query: `mutation Login {
  login(input: {username: "user2", password: "password123"}) {
    id
  }
}`,
            },
            {
              name: 'Login (user3 - t3)',
              endpoint: '/graphql',
              query: `mutation Login {
  login(input: {username: "user3", password: "password123"}) {
    id
  }
}`,
            },
            {
              name: 'Start Report',
              endpoint: '/graphql',
              query: `mutation StartReport {
  startReport {
    id
  }
}`,
            },
            {
              name: 'Report Status',
              endpoint: '/graphql',
              query: `query ReportStatus($id: ID!) {
  reportStatus(id: $id) {
    id
    status
  }
}`,
              variables: '{\n  "id": "PASTE_REPORT_ID_HERE"\n}',
            },
            {
              name: 'Get Report',
              endpoint: '/graphql',
              query: `query GetReport($id: ID!) {
  report(id: $id) {
    id
    userId
    tenantId
    startedAt
    finishedAt
    contents {
      id
      source
      status
      data
    }
  }
}`,
              variables: '{\n  "id": "PASTE_REPORT_ID_HERE"\n}',
            },
            {
              name: 'Register',
              endpoint: '/graphql',
              query: `mutation Register {
  register(
    input: {
      tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      username: "newuser"
      password: "password123"
      taxId: "123-45-6789"
    }
  ) {
    id
    username
    tenantId
    taxId
  }
}`,
            },
          ],
        }),
      ],
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

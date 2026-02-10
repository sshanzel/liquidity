import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {Request, Response} from 'express';
import {join} from 'path';
import {DatabaseModule} from './database/database.module';
import {UserModule} from './user/user.module';
import {AuthModule} from './auth/auth.module';

interface GqlContext {
  req: Request;
  res: Response;
}

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      playground: true,
      context: ({req, res}: GqlContext) => ({req, res}),
    }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}

import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TenantConnectionManager} from './tenant-connection.manager';
import {TenantMapper} from './tenant-mapper.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'liquidity'),
        password: configService.get('POSTGRES_PASSWORD', 'liquidity'),
        database: configService.get('DATABASE_NAME', 'catalog'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  providers: [TenantConnectionManager, TenantMapper],
  exports: [TenantConnectionManager, TenantMapper],
})
export class DbModule {}

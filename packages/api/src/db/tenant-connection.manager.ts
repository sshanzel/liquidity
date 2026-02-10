import {Injectable, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DataSource} from 'typeorm';
import {Report} from './tenant/entities/report.entity';
import {ReportContent} from './tenant/entities/report-content.entity';

export interface TenantConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface TenancyConfig {
  tenant: {
    [tenantId: string]: TenantConfig;
  };
}

@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private connections = new Map<string, DataSource>();
  private tenancyConfig: TenancyConfig;

  constructor(private configService: ConfigService) {
    const configJson = this.configService.getOrThrow<string>('TENANCY_CONFIG');
    this.tenancyConfig = JSON.parse(configJson);
  }

  getConfig(tenantId: string): TenantConfig {
    const tenantConfig = this.tenancyConfig.tenant[tenantId];
    if (!tenantConfig) {
      throw new Error(`No config found for tenant: ${tenantId}`);
    }
    return tenantConfig;
  }

  buildConnectionString(config: TenantConfig): string {
    return `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  async getConnection(tenantId: string): Promise<DataSource> {
    const existing = this.connections.get(tenantId);
    if (existing?.isInitialized) {
      return existing;
    }

    const tenantConfig = this.getConfig(tenantId);

    const dataSource = new DataSource({
      type: 'postgres',
      host: tenantConfig.host,
      port: tenantConfig.port,
      database: tenantConfig.database,
      username: tenantConfig.user,
      password: tenantConfig.password,
      entities: [Report, ReportContent],
      synchronize: false,
    });

    await dataSource.initialize();
    this.connections.set(tenantId, dataSource);

    return dataSource;
  }

  async onModuleDestroy() {
    for (const [, connection] of this.connections) {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
    this.connections.clear();
  }
}

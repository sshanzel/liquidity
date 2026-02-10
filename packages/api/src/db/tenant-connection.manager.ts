import {Injectable, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DataSource} from 'typeorm';
import {Report} from './tenant/entities/report.entity';
import {ReportContent} from './tenant/entities/report-content.entity';

interface TenantConfig {
  connection: string;
}

interface TenancyConfig {
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

  async getConnection(tenantId: string): Promise<DataSource> {
    const existing = this.connections.get(tenantId);
    if (existing?.isInitialized) {
      return existing;
    }

    const tenantConfig = this.tenancyConfig.tenant[tenantId];
    if (!tenantConfig) {
      throw new Error(`No connection config found for tenant: ${tenantId}`);
    }

    const dataSource = new DataSource({
      type: 'postgres',
      url: tenantConfig.connection,
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

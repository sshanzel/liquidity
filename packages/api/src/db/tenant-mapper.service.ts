import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {TenancyConfig} from './tenant-connection.manager';

@Injectable()
export class TenantMapper {
  private databaseToTenantMap = new Map<string, string>();
  private tenantToDatabaseMap = new Map<string, string>();

  constructor(private configService: ConfigService) {
    this.buildMappings();
  }

  private buildMappings(): void {
    const configJson = this.configService.getOrThrow<string>('TENANCY_CONFIG');
    const config: TenancyConfig = JSON.parse(configJson);

    for (const [tenantId, tenantConfig] of Object.entries(config.tenant)) {
      this.databaseToTenantMap.set(tenantConfig.database, tenantId);
      this.tenantToDatabaseMap.set(tenantId, tenantConfig.database);
    }
  }

  getTenantIdByDatabase(database: string): string | null {
    return this.databaseToTenantMap.get(database) || null;
  }

  getDatabaseByTenantId(tenantId: string): string | null {
    return this.tenantToDatabaseMap.get(tenantId) || null;
  }
}

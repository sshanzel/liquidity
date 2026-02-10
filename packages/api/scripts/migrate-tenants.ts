import {execSync} from 'child_process';
import {config} from 'dotenv';
import {resolve} from 'path';

// Load .env from packages/api
config({path: resolve(__dirname, '../.env')});

interface TenantConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface TenancyConfig {
  tenant: {
    [tenantId: string]: TenantConfig;
  };
}

function buildConnectionString(cfg: TenantConfig): string {
  return `postgres://${cfg.user}:${cfg.password}@${cfg.host}:${cfg.port}/${cfg.database}`;
}

const configJson = process.env.TENANCY_CONFIG;
if (!configJson) {
  console.error('TENANCY_CONFIG env var is required');
  process.exit(1);
}

const tenancyConfig: TenancyConfig = JSON.parse(configJson);
const tenants = tenancyConfig.tenant;
const action = process.argv[2] || 'run';

if (!['run', 'revert'].includes(action)) {
  console.error('Usage: ts-node scripts/migrate-tenants.ts [run|revert]');
  process.exit(1);
}

console.log(`Running migration:${action} on ${Object.keys(tenants).length} tenant(s)...\n`);

for (const [tenantId, tenantConfig] of Object.entries(tenants)) {
  console.log(`→ Migrating tenant: ${tenantId}`);
  try {
    const connectionString = buildConnectionString(tenantConfig);
    execSync(`pnpm migration:tenant:${action}`, {
      stdio: 'inherit',
      env: {...process.env, TENANT_CONNECTION_STRING: connectionString},
    });
    console.log(`✓ Tenant ${tenantId} completed\n`);
  } catch (error) {
    console.error(`✗ Tenant ${tenantId} failed\n`);
    process.exit(1);
  }
}

console.log('All tenant migrations completed.');

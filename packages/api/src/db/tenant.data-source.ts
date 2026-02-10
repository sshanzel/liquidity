import {DataSource} from 'typeorm';
import {config} from 'dotenv';
import {resolve} from 'path';

// Load .env from packages/api
config({path: resolve(__dirname, '../../.env')});

// For migrations: pass TENANT_CONNECTION_STRING env var
// Example: TENANT_CONNECTION_STRING=postgres://user:pass@localhost:5432/lqdty_t1
const connectionString = process.env.TENANT_CONNECTION_STRING;

if (!connectionString) {
  throw new Error('TENANT_CONNECTION_STRING env var is required for tenant migrations');
}

export default new DataSource({
  type: 'postgres',
  url: connectionString,
  entities: ['src/db/tenant/entities/*.entity.ts'],
  migrations: ['src/db/tenant/migrations/*.ts'],
});

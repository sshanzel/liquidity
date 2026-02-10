import {DataSource} from 'typeorm';
import {config} from 'dotenv';

config();

// Default tenant DB for migrations - override with TENANT_DB env var
const tenantDb = process.env.TENANT_DB || 'lqdty_t1';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'liquidity',
  password: process.env.POSTGRES_PASSWORD || 'liquidity',
  database: tenantDb,
  entities: ['src/report/entities/*.entity.ts'],
  migrations: ['src/database/tenant/migrations/*.ts'],
});

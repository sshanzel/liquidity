import {DataSource} from 'typeorm';
import {config} from 'dotenv';
import {resolve} from 'path';

// Load .env from packages/api
config({path: resolve(__dirname, '../../.env')});

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'liquidity',
  password: process.env.POSTGRES_PASSWORD || 'liquidity',
  database: process.env.DATABASE_NAME || 'catalog',
  entities: ['src/db/catalog/entities/*.entity.ts'],
  migrations: ['src/db/catalog/migrations/*.ts'],
});

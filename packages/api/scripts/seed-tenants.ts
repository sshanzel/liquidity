import {DataSource} from 'typeorm';
import {config} from 'dotenv';
import {resolve} from 'path';

// Load .env from packages/api
config({path: resolve(__dirname, '../.env')});

const catalogDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'liquidity',
  password: process.env.POSTGRES_PASSWORD || 'liquidity',
  database: process.env.DATABASE_NAME || 'catalog',
});

const tenants = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Tenant One',
    description: 'First tenant organization',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Tenant Two',
    description: 'Second tenant organization',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Tenant Three',
    description: 'Third tenant organization',
  },
];

async function seed() {
  await catalogDataSource.initialize();
  console.log('Connected to catalog database\n');

  const queryRunner = catalogDataSource.createQueryRunner();

  try {
    for (const tenant of tenants) {
      const exists = await queryRunner.query(
        'SELECT id FROM tenants WHERE id = $1',
        [tenant.id]
      );

      if (exists.length > 0) {
        console.log(`→ Tenant "${tenant.name}" already exists, skipping`);
        continue;
      }

      await queryRunner.query(
        'INSERT INTO tenants (id, name, description) VALUES ($1, $2, $3)',
        [tenant.id, tenant.name, tenant.description]
      );
      console.log(`✓ Created tenant: ${tenant.name} (${tenant.id})`);
    }

    console.log('\nSeeding completed.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await catalogDataSource.destroy();
  }
}

seed();

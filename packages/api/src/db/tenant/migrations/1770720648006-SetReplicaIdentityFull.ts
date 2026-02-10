import {MigrationInterface, QueryRunner} from 'typeorm';

export class SetReplicaIdentityFull1770720648006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE report_contents REPLICA IDENTITY FULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE report_contents REPLICA IDENTITY DEFAULT`);
  }
}

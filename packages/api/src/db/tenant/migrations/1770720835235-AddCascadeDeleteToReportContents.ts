import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddCascadeDeleteToReportContents1770720835235 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE report_contents DROP CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9"`);
    await queryRunner.query(`ALTER TABLE report_contents ADD CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9" FOREIGN KEY ("reportId") REFERENCES reports(id) ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE report_contents DROP CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9"`);
    await queryRunner.query(`ALTER TABLE report_contents ADD CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9" FOREIGN KEY ("reportId") REFERENCES reports(id) ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }
}

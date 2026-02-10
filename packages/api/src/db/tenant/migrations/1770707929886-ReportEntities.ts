import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportEntities1770707929886 implements MigrationInterface {
    name = 'ReportEntities1770707929886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."report_contents_status_enum" AS ENUM('in_progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "report_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportId" uuid NOT NULL, "source" character varying NOT NULL, "status" "public"."report_contents_status_enum" NOT NULL DEFAULT 'in_progress', "data" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastRunAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_37b9c12eb2dfa6f2bf728517e5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "userId" character varying NOT NULL, "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "finishedAt" TIMESTAMP, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "report_contents" ADD CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report_contents" DROP CONSTRAINT "FK_c2fe1056354d96db7d7c8480cf9"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "report_contents"`);
        await queryRunner.query(`DROP TYPE "public"."report_contents_status_enum"`);
    }

}

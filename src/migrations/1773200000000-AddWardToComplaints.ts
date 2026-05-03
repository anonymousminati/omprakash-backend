import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `ward` column to the `complaints` table.
 * Idempotent — safe to run even if the column already exists.
 */
export class AddWardToComplaints1773200000000 implements MigrationInterface {
    name = 'AddWardToComplaints1773200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasWard = await queryRunner.hasColumn("complaints", "ward");
        if (!hasWard) {
            await queryRunner.query(
                `ALTER TABLE \`complaints\` ADD COLUMN \`ward\` varchar(50) NULL AFTER \`location\``
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasWard = await queryRunner.hasColumn("complaints", "ward");
        if (hasWard) {
            await queryRunner.query(
                `ALTER TABLE \`complaints\` DROP COLUMN \`ward\``
            );
        }
    }
}

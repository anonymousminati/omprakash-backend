import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds `assigned_wards` column to `users`.
 * Stores a JSON array like ["Ward 1","Ward 5"] or ["ALL"].
 */
export class AddAssignedWardsToUsers1773200000001 implements MigrationInterface {
    name = 'AddAssignedWardsToUsers1773200000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const has = await queryRunner.hasColumn("users", "assigned_wards");
        if (!has) {
            await queryRunner.query(
                `ALTER TABLE \`users\` ADD COLUMN \`assigned_wards\` text NULL`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const has = await queryRunner.hasColumn("users", "assigned_wards");
        if (has) {
            await queryRunner.query(
                `ALTER TABLE \`users\` DROP COLUMN \`assigned_wards\``
            );
        }
    }
}

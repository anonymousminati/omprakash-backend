import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds geo_latitude, geo_longitude, geo_accuracy to the complaints table.
 * Idempotent — skips if the column already exists.
 */
export class AddGeoToComplaints1773200000000 implements MigrationInterface {
    name = 'AddGeoToComplaints1773200000000';

    private async addCol(qr: QueryRunner, table: string, col: string, def: string) {
        if (!await qr.hasColumn(table, col)) {
            await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
            console.log(`  ✓ Added ${table}.${col}`);
        } else {
            console.log(`  − ${table}.${col} already exists, skipping`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.addCol(queryRunner, "complaints", "geo_latitude",  "double NULL AFTER `photo_url`");
        await this.addCol(queryRunner, "complaints", "geo_longitude", "double NULL AFTER `geo_latitude`");
        await this.addCol(queryRunner, "complaints", "geo_accuracy",  "float  NULL AFTER `geo_longitude`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn("complaints", "geo_accuracy"))  await queryRunner.query("ALTER TABLE `complaints` DROP COLUMN `geo_accuracy`");
        if (await queryRunner.hasColumn("complaints", "geo_longitude")) await queryRunner.query("ALTER TABLE `complaints` DROP COLUMN `geo_longitude`");
        if (await queryRunner.hasColumn("complaints", "geo_latitude"))  await queryRunner.query("ALTER TABLE `complaints` DROP COLUMN `geo_latitude`");
    }
}

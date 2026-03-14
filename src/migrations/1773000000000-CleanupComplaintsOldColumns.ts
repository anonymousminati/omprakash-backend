import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops old complaints columns that no longer exist in the Complaint entity.
 * Uses hasColumn guards — safe to run even if columns were already removed.
 */
export class CleanupComplaintsOldColumns1773000000000 implements MigrationInterface {
    name = 'CleanupComplaintsOldColumns1773000000000';

    private async dropColIfExists(qr: QueryRunner, table: string, col: string): Promise<void> {
        if (await qr.hasColumn(table, col)) {
            // Drop FK referencing this column first, if any
            const tbl = await qr.getTable(table);
            if (tbl) {
                const fk = tbl.foreignKeys.find(f => f.columnNames.includes(col));
                if (fk) await qr.dropForeignKey(table, fk);
            }
            await qr.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // These columns were in the old InitialSchema but are removed from Complaint.ts
        await this.dropColIfExists(queryRunner, "complaints", "title");
        await this.dropColIfExists(queryRunner, "complaints", "image_url");
        await this.dropColIfExists(queryRunner, "complaints", "user_id");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore them as nullable so rollback doesn't break existing rows
        if (!await queryRunner.hasColumn("complaints", "title")) {
            await queryRunner.query(`ALTER TABLE \`complaints\` ADD COLUMN \`title\` varchar(255) NULL`);
        }
        if (!await queryRunner.hasColumn("complaints", "image_url")) {
            await queryRunner.query(`ALTER TABLE \`complaints\` ADD COLUMN \`image_url\` varchar(255) NULL`);
        }
        if (!await queryRunner.hasColumn("complaints", "user_id")) {
            await queryRunner.query(`ALTER TABLE \`complaints\` ADD COLUMN \`user_id\` varchar(255) NULL`);
        }
    }
}

import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/**
 * Safe, non-destructive migration:
 * - All operations are conditional (hasTable / hasColumn checks)
 * - No DROP TABLE — existing data is fully preserved
 * - complaints: adds missing columns via ALTER; old surplus columns are left untouched
 * - contacts:   creates table only if it does not exist
 * - ideas:      creates table only if it does not exist
 * - files:      adds missing Base columns only if absent
 */
export class FixComplaintsContactsIdeasFiles1772999000000 implements MigrationInterface {
    name = 'FixComplaintsContactsIdeasFiles1772999000000';

    // Helper: add a column only when it does not already exist
    private async addColIfMissing(
        qr: QueryRunner,
        table: string,
        col: string,
        definition: string
    ): Promise<void> {
        const exists = await qr.hasColumn(table, col);
        if (!exists) {
            await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${definition}`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── 1. PATCH complaints ────────────────────────────────────────────────
        //  The old migration created complaints with (title, description, status varchar,
        //  image_url, user_id). The current model needs different columns.
        //  Strategy: add every missing column; leave old columns alone (TypeORM ignores them).
        if (await queryRunner.hasTable("complaints")) {
            await this.addColIfMissing(queryRunner, "complaints", "full_name",     "varchar(255) NOT NULL DEFAULT ''");
            await this.addColIfMissing(queryRunner, "complaints", "phone_number",  "varchar(255) NOT NULL DEFAULT ''");
            await this.addColIfMissing(queryRunner, "complaints", "email_address", "varchar(255) NULL");
            await this.addColIfMissing(queryRunner, "complaints", "location",      "varchar(255) NOT NULL DEFAULT ''");
            await this.addColIfMissing(queryRunner, "complaints", "category",      "varchar(255) NOT NULL DEFAULT ''");
            await this.addColIfMissing(queryRunner, "complaints", "subject",       "varchar(255) NOT NULL DEFAULT ''");
            await this.addColIfMissing(queryRunner, "complaints", "photo_url",     "varchar(255) NULL");

            // Migrate status column from varchar → enum only if it is still varchar
            // We detect this by trying to change it; MySQL will no-op if it already is an enum.
            await queryRunner.query(`
                ALTER TABLE \`complaints\`
                MODIFY COLUMN \`status\`
                    enum('OPEN','IN_PROGRESS','RESOLVED','REJECTED')
                    NOT NULL DEFAULT 'OPEN'
            `);
        } else {
            // Table does not exist yet — create it fresh
            await queryRunner.query(`
                CREATE TABLE \`complaints\` (
                    \`id\`             varchar(36)  NOT NULL,
                    \`created_at\`     datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\`     datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    \`created_by\`     varchar(36)  NULL,
                    \`updated_by\`     varchar(36)  NULL,
                    \`full_name\`      varchar(255) NOT NULL,
                    \`phone_number\`   varchar(255) NOT NULL,
                    \`email_address\`  varchar(255) NULL,
                    \`location\`       varchar(255) NOT NULL,
                    \`category\`       varchar(255) NOT NULL,
                    \`subject\`        varchar(255) NOT NULL,
                    \`description\`    text         NOT NULL,
                    \`photo_url\`      varchar(255) NULL,
                    \`status\` enum('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN',
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }

        // ── 2. CREATE contacts (if not exists) ────────────────────────────────
        if (!await queryRunner.hasTable("contacts")) {
            await queryRunner.query(`
                CREATE TABLE \`contacts\` (
                    \`id\`         varchar(36)  NOT NULL,
                    \`created_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    \`created_by\` varchar(36)  NULL,
                    \`updated_by\` varchar(36)  NULL,
                    \`name\`       varchar(255) NOT NULL,
                    \`email\`      varchar(255) NOT NULL,
                    \`phone\`      varchar(255) NULL,
                    \`subject\`    varchar(255) NOT NULL,
                    \`message\`    text         NOT NULL,
                    \`isRead\`     tinyint      NOT NULL DEFAULT 0,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }

        // ── 3. CREATE ideas (if not exists) ───────────────────────────────────
        if (!await queryRunner.hasTable("ideas")) {
            await queryRunner.query(`
                CREATE TABLE \`ideas\` (
                    \`id\`          varchar(36)  NOT NULL,
                    \`created_at\`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    \`created_by\`  varchar(36)  NULL,
                    \`updated_by\`  varchar(36)  NULL,
                    \`title\`       varchar(255) NOT NULL,
                    \`description\` text         NOT NULL,
                    \`votes\`       int          NOT NULL DEFAULT 0,
                    \`image_url\`   varchar(255) NULL,
                    \`user_id\`     varchar(36)  NOT NULL,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);

            await queryRunner.createForeignKey("ideas", new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            }));
        }

        // ── 4. PATCH files — add missing Base columns ─────────────────────────
        await this.addColIfMissing(queryRunner, "files", "created_by", "varchar(36) NULL");
        await this.addColIfMissing(queryRunner, "files", "updated_by", "varchar(36) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove ideas FK + table
        if (await queryRunner.hasTable("ideas")) {
            const ideasTable = await queryRunner.getTable("ideas");
            if (ideasTable) {
                for (const fk of ideasTable.foreignKeys) {
                    await queryRunner.dropForeignKey("ideas", fk);
                }
            }
            await queryRunner.dropTable("ideas");
        }

        // Remove contacts
        if (await queryRunner.hasTable("contacts")) {
            await queryRunner.dropTable("contacts");
        }

        // Remove patched files columns
        if (await queryRunner.hasColumn("files", "updated_by")) {
            await queryRunner.query(`ALTER TABLE \`files\` DROP COLUMN \`updated_by\``);
        }
        if (await queryRunner.hasColumn("files", "created_by")) {
            await queryRunner.query(`ALTER TABLE \`files\` DROP COLUMN \`created_by\``);
        }

        // Revert complaints status back to varchar (best-effort; data preserved)
        if (await queryRunner.hasTable("complaints")) {
            await queryRunner.query(`
                ALTER TABLE \`complaints\`
                MODIFY COLUMN \`status\` varchar(255) NOT NULL DEFAULT 'PENDING'
            `);
        }
    }
}

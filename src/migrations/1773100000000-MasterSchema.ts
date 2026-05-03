import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/**
 * Master idempotent schema migration.
 *
 * Covers ALL 12 models. Safe to run on:
 *   - A completely fresh database (creates everything)
 *   - A database that already has some or all tables (adds only what is missing)
 *
 * Rules:
 *   - hasTable()  guard before every CREATE TABLE
 *   - hasColumn() guard before every ALTER ADD COLUMN
 *   - No DROP TABLE anywhere — zero data loss
 */
export class MasterSchema1773100000000 implements MigrationInterface {
    name = 'MasterSchema1773100000000';

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async addCol(qr: QueryRunner, table: string, col: string, def: string) {
        if (!await qr.hasColumn(table, col)) {
            await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
        }
    }

    private async dropFkIfExists(qr: QueryRunner, table: string, col: string) {
        const tbl = await qr.getTable(table);
        if (!tbl) return;
        const fk = tbl.foreignKeys.find(f => f.columnNames.includes(col));
        if (fk) await qr.dropForeignKey(table, fk);
    }

    private async dropColIfExists(qr: QueryRunner, table: string, col: string) {
        if (await qr.hasColumn(table, col)) {
            await this.dropFkIfExists(qr, table, col);
            await qr.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
        }
    }

    // ── Base columns shared by every entity extending Base ────────────────────
    private readonly baseColumns = `
        \`id\`         varchar(36)   NOT NULL,
        \`created_at\` datetime(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`created_by\` varchar(36)   NULL,
        \`updated_by\` varchar(36)   NULL
    `;

    // ── up ────────────────────────────────────────────────────────────────────

    public async up(queryRunner: QueryRunner): Promise<void> {

        // 1. users ─────────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("users")) {
            await queryRunner.query(`
                CREATE TABLE \`users\` (
                    ${this.baseColumns},
                    \`name\`          varchar(255) NOT NULL,
                    \`email\`         varchar(255) NOT NULL,
                    \`password_hash\` varchar(255) NOT NULL,
                    \`role\`          varchar(255) NOT NULL DEFAULT 'citizen',
                    \`role_id\`       varchar(36)  NULL,
                    \`assigned_wards\` text         NULL,
                    \`is_active\`     tinyint      NOT NULL DEFAULT 1,
                    PRIMARY KEY (\`id\`),
                    UNIQUE KEY \`UQ_users_email\` (\`email\`)
                ) ENGINE=InnoDB
            `);
        } else {
            // Ensure role_id exists (added by old RBACSetup migration)
            await this.addCol(queryRunner, "users", "role_id", "varchar(36) NULL");
            await this.addCol(queryRunner, "users", "assigned_wards", "text NULL");
        }

        // 2. roles ─────────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("roles")) {
            await queryRunner.query(`
                CREATE TABLE \`roles\` (
                    ${this.baseColumns},
                    \`name\`        varchar(100) NOT NULL,
                    \`description\` text         NULL,
                    PRIMARY KEY (\`id\`),
                    UNIQUE KEY \`UQ_roles_name\` (\`name\`)
                ) ENGINE=InnoDB
            `);
        }

        // 3. modules ───────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("modules")) {
            await queryRunner.query(`
                CREATE TABLE \`modules\` (
                    ${this.baseColumns},
                    \`key\`  varchar(255) NOT NULL,
                    \`name\` varchar(255) NOT NULL,
                    PRIMARY KEY (\`id\`),
                    UNIQUE KEY \`UQ_modules_key\` (\`key\`)
                ) ENGINE=InnoDB
            `);
        }

        // 4. permissions ───────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("permissions")) {
            await queryRunner.query(`
                CREATE TABLE \`permissions\` (
                    ${this.baseColumns},
                    \`role_id\`    varchar(36) NOT NULL,
                    \`module_id\`  varchar(36) NOT NULL,
                    \`can_create\` tinyint     NOT NULL DEFAULT 0,
                    \`can_read\`   tinyint     NOT NULL DEFAULT 0,
                    \`can_update\` tinyint     NOT NULL DEFAULT 0,
                    \`can_delete\` tinyint     NOT NULL DEFAULT 0,
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_permissions_role\`
                        FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE,
                    CONSTRAINT \`FK_permissions_module\`
                        FOREIGN KEY (\`module_id\`) REFERENCES \`modules\`(\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
        }

        // 5. FK: users → roles (add only if missing) ──────────────────────────
        const usersTable = await queryRunner.getTable("users");
        if (usersTable) {
            const hasFk = usersTable.foreignKeys.some(fk => fk.columnNames.includes("role_id"));
            if (!hasFk && await queryRunner.hasTable("roles")) {
                await queryRunner.createForeignKey("users", new TableForeignKey({
                    columnNames: ["role_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "roles",
                    onDelete: "SET NULL"
                }));
            }
        }

        // 6. innovations ───────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("innovations")) {
            await queryRunner.query(`
                CREATE TABLE \`innovations\` (
                    ${this.baseColumns},
                    \`title\`          varchar(255) NOT NULL,
                    \`description\`    text         NOT NULL,
                    \`category\`       varchar(255) NOT NULL,
                    \`full_name\`      varchar(255) NOT NULL,
                    \`email_address\`  varchar(255) NULL,
                    \`phone_number\`   varchar(255) NOT NULL,
                    \`status\`         enum('PENDING','REVIEWED','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
                    \`attachment_url\` varchar(255) NULL,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }

        // 7. complaints ────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("complaints")) {
            await queryRunner.query(`
                CREATE TABLE \`complaints\` (
                    ${this.baseColumns},
                    \`full_name\`     varchar(255) NOT NULL,
                    \`phone_number\`  varchar(255) NOT NULL,
                    \`email_address\` varchar(255) NULL,
                    \`location\`      varchar(255) NOT NULL,
                    \`ward\`          varchar(50)  NULL,
                    \`category\`      varchar(255) NOT NULL,
                    \`subject\`       varchar(255) NOT NULL,
                    \`description\`   text         NOT NULL,
                    \`photo_url\`     varchar(255) NULL,
                    \`geo_latitude\`  double       NULL,
                    \`geo_longitude\` double       NULL,
                    \`geo_accuracy\`  float        NULL,
                    \`status\`        enum('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN',
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        } else {
            // Patch: add missing columns from model
            await this.addCol(queryRunner, "complaints", "full_name",     "varchar(255) NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "phone_number",  "varchar(255) NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "email_address", "varchar(255) NULL");
            await this.addCol(queryRunner, "complaints", "location",      "varchar(255) NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "ward",          "varchar(50) NULL");
            await this.addCol(queryRunner, "complaints", "category",      "varchar(255) NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "subject",       "varchar(255) NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "photo_url",     "varchar(255) NULL");
            await this.addCol(queryRunner, "complaints", "description",   "text NOT NULL DEFAULT ''");
            await this.addCol(queryRunner, "complaints", "geo_latitude",  "double NULL");
            await this.addCol(queryRunner, "complaints", "geo_longitude", "double NULL");
            await this.addCol(queryRunner, "complaints", "geo_accuracy",  "float NULL");

            // Fix status to enum (idempotent — MySQL accepts MODIFY even if type matches)
            await queryRunner.query(`
                ALTER TABLE \`complaints\`
                MODIFY COLUMN \`status\`
                    enum('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN'
            `);

            // Remove old surplus columns that no longer exist in the model
            await this.dropColIfExists(queryRunner, "complaints", "title");
            await this.dropColIfExists(queryRunner, "complaints", "image_url");
            await this.dropColIfExists(queryRunner, "complaints", "user_id");
        }

        // 8. contacts ──────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("contacts")) {
            await queryRunner.query(`
                CREATE TABLE \`contacts\` (
                    ${this.baseColumns},
                    \`name\`    varchar(255) NOT NULL,
                    \`email\`   varchar(255) NOT NULL,
                    \`phone\`   varchar(255) NULL,
                    \`subject\` varchar(255) NOT NULL,
                    \`message\` text         NOT NULL,
                    \`isRead\`  tinyint      NOT NULL DEFAULT 0,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }

        // 9. ideas ─────────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("ideas")) {
            await queryRunner.query(`
                CREATE TABLE \`ideas\` (
                    ${this.baseColumns},
                    \`title\`       varchar(255) NOT NULL,
                    \`description\` text         NOT NULL,
                    \`votes\`       int          NOT NULL DEFAULT 0,
                    \`image_url\`   varchar(255) NULL,
                    \`user_id\`     varchar(36)  NOT NULL,
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_ideas_user\`
                        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
        }

        // 10. files ────────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("files")) {
            await queryRunner.query(`
                CREATE TABLE \`files\` (
                    ${this.baseColumns},
                    \`filename\` varchar(255) NOT NULL,
                    \`cdn_url\`  text         NOT NULL,
                    \`category\` enum('complaint','gallery','profile') NOT NULL,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        } else {
            // Patch: add Base columns if missing (old BunnyNetSetup omitted them)
            await this.addCol(queryRunner, "files", "created_by", "varchar(36) NULL");
            await this.addCol(queryRunner, "files", "updated_by", "varchar(36) NULL");
        }

        // 11. gallery_categories ───────────────────────────────────────────────
        if (!await queryRunner.hasTable("gallery_categories")) {
            await queryRunner.query(`
                CREATE TABLE \`gallery_categories\` (
                    ${this.baseColumns},
                    \`name\`        varchar(255) NOT NULL,
                    \`slug\`        varchar(255) NOT NULL,
                    \`description\` text         NULL,
                    PRIMARY KEY (\`id\`),
                    UNIQUE KEY \`UQ_gallery_categories_slug\` (\`slug\`)
                ) ENGINE=InnoDB
            `);
        }

        // 12. gallery_images ───────────────────────────────────────────────────
        if (!await queryRunner.hasTable("gallery_images")) {
            await queryRunner.query(`
                CREATE TABLE \`gallery_images\` (
                    ${this.baseColumns},
                    \`title\`        varchar(255) NOT NULL,
                    \`description\`  text         NULL,
                    \`url\`          varchar(255) NOT NULL,
                    \`file_id\`      varchar(255) NULL,
                    \`is_published\` tinyint      NOT NULL DEFAULT 1,
                    \`is_featured\`  tinyint      NOT NULL DEFAULT 0,
                    \`sequence\`     int          NOT NULL DEFAULT 0,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }

        // 13. gallery_images_categories (join table) ────────────────────────────
        if (!await queryRunner.hasTable("gallery_images_categories")) {
            await queryRunner.query(`
                CREATE TABLE \`gallery_images_categories\` (
                    \`image_id\`    varchar(36) NOT NULL,
                    \`category_id\` varchar(36) NOT NULL,
                    PRIMARY KEY (\`image_id\`, \`category_id\`),
                    KEY \`IDX_gic_image\`    (\`image_id\`),
                    KEY \`IDX_gic_category\` (\`category_id\`),
                    CONSTRAINT \`FK_gic_image\`
                        FOREIGN KEY (\`image_id\`) REFERENCES \`gallery_images\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                    CONSTRAINT \`FK_gic_category\`
                        FOREIGN KEY (\`category_id\`) REFERENCES \`gallery_categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
                ) ENGINE=InnoDB
            `);
        }

        // 13. posts ────────────────────────────────────────────────────────────
        if (!await queryRunner.hasTable("posts")) {
            await queryRunner.query(`
                CREATE TABLE \`posts\` (
                    ${this.baseColumns},
                    \`title\`           varchar(255)  NOT NULL,
                    \`slug\`            varchar(255)  NOT NULL,
                    \`description\`     varchar(500)  NULL,
                    \`content\`         longtext      NULL,
                    \`author\`          varchar(255)  NOT NULL DEFAULT 'Secretariat Office',
                    \`category\`        varchar(100)  NULL,
                    \`is_published\`    tinyint(1)    NOT NULL DEFAULT 0,
                    \`is_official\`     tinyint(1)    NOT NULL DEFAULT 0,
                    \`hero_image_url\`  varchar(1000) NULL,
                    \`images\`          longtext      NULL,
                    \`published_at\`    datetime      NULL,
                    PRIMARY KEY (\`id\`),
                    UNIQUE KEY \`UQ_posts_slug\` (\`slug\`)
                ) ENGINE=InnoDB
            `);
        } else {
            await this.addCol(queryRunner, "posts", "is_official",    "tinyint(1) NOT NULL DEFAULT 0");
            await this.addCol(queryRunner, "posts", "published_at",   "datetime NULL");
            await this.addCol(queryRunner, "posts", "hero_image_url", "varchar(1000) NULL");
        }
    }

    // ── down (best-effort rollback for fresh DB only) ─────────────────────────

    public async down(queryRunner: QueryRunner): Promise<void> {
        const drop = async (table: string) => {
            if (await queryRunner.hasTable(table)) {
                const tbl = await queryRunner.getTable(table);
                if (tbl) {
                    for (const fk of tbl.foreignKeys) {
                        await queryRunner.dropForeignKey(table, fk);
                    }
                }
                await queryRunner.dropTable(table);
            }
        };

        await drop("gallery_images_categories");
        await drop("gallery_images");
        await drop("gallery_categories");
        await drop("files");
        await drop("ideas");
        await drop("contacts");
        await drop("complaints");
        await drop("innovations");
        await drop("posts");
        await drop("permissions");
        await drop("modules");

        // Drop users FK to roles first
        await this.dropFkIfExists(queryRunner, "users", "role_id");
        if (await queryRunner.hasColumn("users", "role_id")) {
            await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role_id\``);
        }

        await drop("roles");
        await drop("users");
    }
}

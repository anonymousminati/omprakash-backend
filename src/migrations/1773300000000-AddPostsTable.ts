import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `posts` table.
 * Idempotent — safe to run on databases that already have this table.
 */
export class AddPostsTable1773300000000 implements MigrationInterface {
    name = 'AddPostsTable1773300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable("posts")) {
            // Table already exists — apply any missing columns only
            const addCol = async (col: string, def: string) => {
                if (!await queryRunner.hasColumn("posts", col)) {
                    await queryRunner.query(`ALTER TABLE \`posts\` ADD COLUMN \`${col}\` ${def}`);
                }
            };
            await addCol("is_official",    "tinyint(1) NOT NULL DEFAULT 0");
            await addCol("published_at",   "datetime NULL");
            await addCol("hero_image_url", "varchar(1000) NULL");
            return;
        }

        await queryRunner.query(`
            CREATE TABLE \`posts\` (
                \`id\`             varchar(36)   NOT NULL,
                \`created_at\`     datetime(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\`     datetime(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\`     varchar(36)   NULL,
                \`updated_by\`     varchar(36)   NULL,
                \`title\`          varchar(255)  NOT NULL,
                \`slug\`           varchar(255)  NOT NULL,
                \`description\`    varchar(500)  NULL,
                \`content\`        longtext      NULL,
                \`author\`         varchar(255)  NOT NULL DEFAULT 'Secretariat Office',
                \`category\`       varchar(100)  NULL,
                \`is_published\`   tinyint(1)    NOT NULL DEFAULT 0,
                \`is_official\`    tinyint(1)    NOT NULL DEFAULT 0,
                \`hero_image_url\` varchar(1000) NULL,
                \`images\`         longtext      NULL,
                \`published_at\`   datetime      NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_posts_slug\` (\`slug\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable("posts")) {
            await queryRunner.query(`DROP TABLE \`posts\``);
        }
    }
}

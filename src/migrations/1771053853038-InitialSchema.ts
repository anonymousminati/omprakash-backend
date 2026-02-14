import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771053853038 implements MigrationInterface {
    name = 'InitialSchema1771053853038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!await queryRunner.hasTable("users")) {
            await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` varchar(255) NOT NULL DEFAULT 'citizen', \`is_active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        }

        if (!await queryRunner.hasTable("complaints")) {
            await queryRunner.query(`CREATE TABLE \`complaints\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'PENDING', \`image_url\` varchar(255) NULL, \`user_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
            await queryRunner.query(`ALTER TABLE \`complaints\` ADD CONSTRAINT \`FK_250ea1d40f7a564243d77705e09\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`complaints\` DROP FOREIGN KEY \`FK_250ea1d40f7a564243d77705e09\``);
        await queryRunner.query(`DROP TABLE \`complaints\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGalleryModels1772955076441 implements MigrationInterface {
    name = 'AddGalleryModels1772955076441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gallery_categories\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` text NULL, UNIQUE INDEX \`IDX_866a897c1f1f0a02c80036f248\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gallery_images\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`url\` varchar(255) NOT NULL, \`file_id\` varchar(255) NULL, \`is_published\` tinyint NOT NULL DEFAULT 1, \`is_featured\` tinyint NOT NULL DEFAULT 0, \`sequence\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gallery_images_categories\` (\`image_id\` varchar(36) NOT NULL, \`category_id\` varchar(36) NOT NULL, INDEX \`IDX_6a73e0acf68c99f1a1c0611bca\` (\`image_id\`), INDEX \`IDX_646b6182be657ea97d9c04e5f5\` (\`category_id\`), PRIMARY KEY (\`image_id\`, \`category_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`gallery_images_categories\` ADD CONSTRAINT \`FK_6a73e0acf68c99f1a1c0611bcaa\` FOREIGN KEY (\`image_id\`) REFERENCES \`gallery_images\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`gallery_images_categories\` ADD CONSTRAINT \`FK_646b6182be657ea97d9c04e5f5d\` FOREIGN KEY (\`category_id\`) REFERENCES \`gallery_categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gallery_images_categories\` DROP FOREIGN KEY \`FK_646b6182be657ea97d9c04e5f5d\``);
        await queryRunner.query(`ALTER TABLE \`gallery_images_categories\` DROP FOREIGN KEY \`FK_6a73e0acf68c99f1a1c0611bcaa\``);
        await queryRunner.query(`DROP INDEX \`IDX_646b6182be657ea97d9c04e5f5\` ON \`gallery_images_categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_6a73e0acf68c99f1a1c0611bca\` ON \`gallery_images_categories\``);
        await queryRunner.query(`DROP TABLE \`gallery_images_categories\``);
        await queryRunner.query(`DROP TABLE \`gallery_images\``);
        await queryRunner.query(`DROP INDEX \`IDX_866a897c1f1f0a02c80036f248\` ON \`gallery_categories\``);
        await queryRunner.query(`DROP TABLE \`gallery_categories\``);
    }

}

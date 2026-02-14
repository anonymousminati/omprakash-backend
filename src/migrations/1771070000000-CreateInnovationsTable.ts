import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInnovationsTable1771070000000 implements MigrationInterface {
    name = 'CreateInnovationsTable1771070000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Innovations Table
        await queryRunner.query(`CREATE TABLE \`innovations\` (
            \`id\` varchar(36) NOT NULL, 
            \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
            \`created_by\` varchar(255) NULL, 
            \`updated_by\` varchar(255) NULL, 
            \`title\` varchar(255) NOT NULL, 
            \`description\` text NOT NULL, 
            \`category\` varchar(255) NOT NULL,
            \`full_name\` varchar(255) NOT NULL,
            \`email_address\` varchar(255) NULL,
            \`phone_number\` varchar(255) NOT NULL,
            \`status\` enum ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
            \`attachment_url\` varchar(255) NULL, 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`innovations\``);
    }
}

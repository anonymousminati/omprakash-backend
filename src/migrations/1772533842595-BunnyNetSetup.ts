import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class BunnyNetSetup1772533842595 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "files",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" },
                { name: "filename", type: "varchar" },
                { name: "cdn_url", type: "text" },
                { name: "category", type: "enum", enum: ["complaint", "gallery", "profile"] }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("files");
    }

}

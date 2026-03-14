import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class BunnyNetSetup1772533842595 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "files",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "filename", type: "varchar", length: "255" },
                { name: "cdn_url", type: "text" },
                { name: "category", type: "enum", enum: ["complaint", "gallery", "profile"] }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("files");
    }
}
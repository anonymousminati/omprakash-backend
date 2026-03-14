import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class RBACSetup1771053853039 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Roles Table
        await queryRunner.createTable(new Table({
            name: "roles",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "name", type: "varchar", isUnique: true },
                { name: "description", type: "text", isNullable: true }
            ]
        }), true);

        // 2. Create Modules Table
        await queryRunner.createTable(new Table({
            name: "modules",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "created_by", type: "varchar", length: "36", isNullable: true }, // Add this
                { name: "updated_by", type: "varchar", length: "36", isNullable: true }, // Add this
                { name: "key", type: "varchar", isUnique: true },
                { name: "name", type: "varchar" }
            ]
        }), true);
        
        // 3. Create Permissions Table
        await queryRunner.createTable(new Table({
            name: "permissions",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "role_id", type: "varchar", length: "36" },
                { name: "module_id", type: "varchar", length: "36" },
                { name: "can_create", type: "tinyint", default: 0 },
                { name: "can_read", type: "tinyint", default: 0 },
                { name: "can_update", type: "tinyint", default: 0 },
                { name: "can_delete", type: "tinyint", default: 0 }
            ]
        }), true);

        await queryRunner.createForeignKey("permissions", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("permissions", new TableForeignKey({
            columnNames: ["module_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "modules",
            onDelete: "CASCADE"
        }));

        // 4. Update Users Table
        await queryRunner.addColumn("users", new TableColumn({
            name: "role_id",
            type: "varchar",
            length: "36",
            isNullable: true
        }));

        await queryRunner.createForeignKey("users", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "SET NULL"
        }));

        // 5. Data Migration (MySQL Syntax)
        // Note: Using (UUID()) function for MySQL 8.0+
        await queryRunner.query(`INSERT INTO roles (id, name, description) VALUES (UUID(), 'Superadmin', 'Full Access'), (UUID(), 'Citizen', 'Default User')`);

        await queryRunner.query(`
            UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Superadmin') WHERE role = 'superadmin';
        `);
        await queryRunner.query(`
            UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Citizen') WHERE role = 'citizen' OR role IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable("users");
        const foreignKey = usersTable!.foreignKeys.find(fk => fk.columnNames.indexOf("role_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("users", foreignKey);
        }
        await queryRunner.dropColumn("users", "role_id");
        await queryRunner.dropTable("permissions");
        await queryRunner.dropTable("modules");
        await queryRunner.dropTable("roles");
    }
}
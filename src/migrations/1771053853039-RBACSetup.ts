import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class RBACSetup1771053853039 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Roles Table
        await queryRunner.createTable(new Table({
            name: "roles",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" },
                { name: "name", type: "varchar", isUnique: true },
                { name: "description", type: "text", isNullable: true }
            ]
        }), true);

        // 2. Create Modules Table
        await queryRunner.createTable(new Table({
            name: "modules",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" },
                { name: "key", type: "varchar", isUnique: true },
                { name: "name", type: "varchar" }
            ]
        }), true);

        // 3. Create Permissions Table
        await queryRunner.createTable(new Table({
            name: "permissions",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" },
                { name: "role_id", type: "uuid" },
                { name: "module_id", type: "uuid" },
                { name: "can_create", type: "boolean", default: false },
                { name: "can_read", type: "boolean", default: false },
                { name: "can_update", type: "boolean", default: false },
                { name: "can_delete", type: "boolean", default: false }
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
            type: "uuid",
            isNullable: true
        }));

        await queryRunner.createForeignKey("users", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "SET NULL"
        }));

        // 5. Data Migration (Best effort)
        // Insert default roles
        await queryRunner.query(`INSERT INTO roles (id, name, description) VALUES (uuid_generate_v4(), 'Superadmin', 'Full Access'), (uuid_generate_v4(), 'Citizen', 'Default User')`);

        // Migrate users based on string role
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
        await queryRunner.dropForeignKey("users", foreignKey!);
        await queryRunner.dropColumn("users", "role_id");
        await queryRunner.dropTable("permissions");
        await queryRunner.dropTable("modules");
        await queryRunner.dropTable("roles");
    }

}

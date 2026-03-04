import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComplaintModuleRBAC1772601000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insert into modules
        await queryRunner.query(`
            INSERT INTO modules (id, key, name) 
            VALUES (uuid_generate_v4(), 'complaints', 'Complaints')
        `);

        // 2. Grant Superadmin permission
        await queryRunner.query(`
            INSERT INTO permissions (id, role_id, module_id, can_create, can_read, can_update, can_delete)
            SELECT uuid_generate_v4(), r.id, m.id, true, true, true, true
            FROM roles r, modules m
            WHERE r.name = 'Superadmin' AND m.key = 'complaints'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM permissions 
            WHERE module_id = (SELECT id FROM modules WHERE key = 'complaints')
        `);
        await queryRunner.query(`
            DELETE FROM modules WHERE key = 'complaints'
        `);
    }
}

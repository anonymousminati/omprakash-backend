import { MigrationInterface, QueryRunner } from "typeorm";
import { Module } from "../models/Module";
import { Role } from "../models/Role";
import { Permission } from "../models/Permission";

export class AddComplaintContactModulesRBAC1772601000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // We use the EntityManager to do this safely regardless of MySQL vs Postgres UUID logic
        const manager = queryRunner.manager;

        // 1. Get or Create Modules
        const modulesData = [
            { key: 'complaints', name: 'Complaints' },
            { key: 'contacts', name: 'Contacts' }
        ];

        for (const data of modulesData) {
            let module = await manager.findOne(Module, { where: { key: data.key } });
            if (!module) {
                module = manager.create(Module, data);
                await manager.save(Module, module);
            }
        }

        // 2. Grant permissions to Superadmin
        const superadmin = await manager.findOne(Role, { where: { name: 'Superadmin' } });

        if (superadmin) {
            for (const data of modulesData) {
                const module = await manager.findOne(Module, { where: { key: data.key } });
                if (module) {
                    const existingPermission = await manager.findOne(Permission, {
                        where: { role: { id: superadmin.id }, module: { id: module.id } }
                    });

                    if (!existingPermission) {
                        const newPermission = manager.create(Permission, {
                            role: superadmin,
                            module: module,
                            can_create: true,
                            can_read: true,
                            can_update: true,
                            can_delete: true
                        });
                        await manager.save(Permission, newPermission);
                    }
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const manager = queryRunner.manager;
        const modulesData = ['complaints', 'contacts'];

        for (const key of modulesData) {
            const module = await manager.findOne(Module, { where: { key } });
            if (module) {
                await manager.delete(Permission, { module: { id: module.id } });
                await manager.delete(Module, { id: module.id });
            }
        }
    }
}

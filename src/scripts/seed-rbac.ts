import { AppDataSource } from "../config/database";
import { Module } from "../models/Module";
import { Role } from "../models/Role";
import { Permission } from "../models/Permission";
import { User } from "../models/User";

const seedRBAC = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database connected for RBAC seeding");

        const moduleRepo = AppDataSource.getRepository(Module);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);
        const userRepo = AppDataSource.getRepository(User);

        // 1. Ensure Modules Exist
        const modulesData = [
            { key: 'users', name: 'User Management' },
            { key: 'innovations', name: 'Innovations' },
        ];

        for (const m of modulesData) {
            let module = await moduleRepo.findOneBy({ key: m.key });
            if (!module) {
                module = moduleRepo.create(m);
                await moduleRepo.save(module);
                console.log(`Created Module: ${m.name}`);
            }
        }

        // 2. Ensure Superadmin Role & Permissions
        let superadminRole = await roleRepo.findOneBy({ name: 'Superadmin' });
        if (!superadminRole) {
            superadminRole = roleRepo.create({ name: 'Superadmin', description: 'Full System Access' });
            await roleRepo.save(superadminRole);
            console.log("Created Superadmin Role");
        }

        const allModules = await moduleRepo.find();

        for (const module of allModules) {
            let perm = await permRepo.findOneBy({ role: { id: superadminRole.id }, module: { id: module.id } });
            if (!perm) {
                perm = permRepo.create({
                    role: superadminRole,
                    module: module,
                    can_create: true,
                    can_read: true,
                    can_update: true,
                    can_delete: true
                });
                await permRepo.save(perm);
                console.log(`Granted full access to Superadmin for ${module.name}`);
            }
        }

        // 3. Ensure Superadmin User has the Role (Fixing any missed migrations)
        const superadminUser = await userRepo.findOneBy({ email: 'superadmin@omprakash.com' });
        if (superadminUser && !superadminUser.role_relation) {
            superadminUser.role_relation = superadminRole;
            await userRepo.save(superadminUser);
            console.log("Linked Superadmin User to Superadmin Role");
        }

        console.log("RBAC Seeding Complete");
        process.exit(0);
    } catch (error) {
        console.error("RBAC Seeding Failed:", error);
        process.exit(1);
    }
};

seedRBAC();

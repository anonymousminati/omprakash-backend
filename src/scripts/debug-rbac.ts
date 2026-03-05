import { AppDataSource } from "../config/database";
import { User } from "../models/User";

const checkUserPerms = async () => {
    try {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);

        const userWithRole = await userRepo.findOne({
            where: { email: 'superadmin@omprakash.com' },
            relations: ['role_relation', 'role_relation.permissions', 'role_relation.permissions.module']
        });

        console.log("Found User:", userWithRole?.email);
        console.log("Role ID:", userWithRole?.role_relation?.id);
        console.log("Role Name:", userWithRole?.role_relation?.name);

        if (userWithRole?.role_relation?.permissions) {
            console.log("Permissions Count:", userWithRole.role_relation.permissions.length);
            for (const p of userWithRole.role_relation.permissions) {
                console.log(`- Module: ${p.module?.key} | Read: ${p.can_read}`);
            }
        } else {
            console.log("No permissions array found on role_relation");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUserPerms();

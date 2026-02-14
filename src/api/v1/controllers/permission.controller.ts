import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { Permission } from '../../../models/Permission';
import { Module } from '../../../models/Module';
import { Role } from '../../../models/Role';

export class PermissionController {
    private permissionRepo = AppDataSource.getRepository(Permission);
    private moduleRepo = AppDataSource.getRepository(Module);
    private roleRepo = AppDataSource.getRepository(Role);

    // Get permissions for a specific role (including modules with no explicit permission set yet)
    getRolePermissions = async (req: Request, res: Response) => {
        try {
            const { roleId } = req.params;

            // Get all available modules
            const modules = await this.moduleRepo.find();

            // Get existing permissions
            const existingPermissions = await this.permissionRepo.find({
                where: { role: { id: roleId } },
                relations: ['module']
            });

            // Map to a cleaner format, filling in gaps
            const result = modules.map(mod => {
                const existing = existingPermissions.find(p => p.module.id === mod.id);
                return {
                    module_id: mod.id,
                    module_name: mod.name,
                    module_key: mod.key,
                    can_create: existing?.can_create || false,
                    can_read: existing?.can_read || false,
                    can_update: existing?.can_update || false,
                    can_delete: existing?.can_delete || false,
                    permission_id: existing?.id || null
                };
            });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get permissions error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { roleId, permissions } = req.body;
            // permissions: Array<{ moduleId: string, can_create: boolean... }>

            const role = await this.roleRepo.findOneBy({ id: roleId });
            if (!role) {
                return res.status(404).json({ success: false, message: 'Role not found' });
            }

            for (const p of permissions) {
                let perm = await this.permissionRepo.findOne({
                    where: { role: { id: roleId }, module: { id: p.moduleId } }
                });

                if (!perm) {
                    const module = await this.moduleRepo.findOneBy({ id: p.moduleId });
                    if (!module) continue;

                    perm = this.permissionRepo.create({
                        role,
                        module,
                        can_create: p.can_create,
                        can_read: p.can_read,
                        can_update: p.can_update,
                        can_delete: p.can_delete
                    });
                } else {
                    perm.can_create = p.can_create;
                    perm.can_read = p.can_read;
                    perm.can_update = p.can_update;
                    perm.can_delete = p.can_delete;
                }
                await this.permissionRepo.save(perm);
            }

            return res.status(200).json({ success: true, message: 'Permissions updated' });
        } catch (error) {
            console.error('Update permissions error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

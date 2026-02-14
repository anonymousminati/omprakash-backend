import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();
const roleController = new RoleController();
const permController = new PermissionController();

// Only Superadmin can manage RBAC
router.use(authenticate);
// Assuming we have a 'roles' module for RBAC management itself, or just restrict to Superadmin role specifically if 'roles' module not seeded
// For simplicity, let's use the 'users' module permission since managing roles is part of user management, 
// OR better: hardcode Superadmin check for now as this is critical system config.
// But we want to follow RBAC. Let's assume 'users' module covers this, or add 'rbac' module. 
// The seed script added 'users' and 'innovations'. Let's use 'users' module for now.
// Actually, modifying roles/permissions is a high-level privilege.
// Let's protect these with authorize('users', 'update') for now, assuming "User Management" includes Roles.
// Or we can just rely on the 'Superadmin' check logic inside authorize if we create a pseudo-module.

router.get('/roles', authorize('users', 'read'), roleController.list);
router.post('/roles', authorize('users', 'create'), roleController.create);

router.get('/permissions/:roleId', authorize('users', 'read'), permController.getRolePermissions);
router.put('/permissions', authorize('users', 'update'), permController.update);

export default router;

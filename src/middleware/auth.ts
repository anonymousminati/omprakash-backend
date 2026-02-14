import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: User;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.id } });

        if (!user || !user.is_active) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

export const authorize = (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }

            // Load role relation if not already loaded (though authenticate should load it)
            // For now, assuming authenticate loads it or we fetch it here
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({
                where: { id: req.user.id },
                relations: ['role_relation', 'role_relation.permissions', 'role_relation.permissions.module']
            });

            if (!user || !user.role_relation) {
                return res.status(403).json({ success: false, message: 'Access denied: No role assigned' });
            }

            // Superadmin bypass
            if (user.role_relation.name === 'Superadmin') {
                return next();
            }

            // Check permissions
            const permission = user.role_relation.permissions.find(
                p => p.module.key === moduleKey
            );

            if (!permission) {
                return res.status(403).json({ success: false, message: 'Access denied: No access to this module' });
            }

            const canPerformAction =
                (action === 'create' && permission.can_create) ||
                (action === 'read' && permission.can_read) ||
                (action === 'update' && permission.can_update) ||
                (action === 'delete' && permission.can_delete);

            if (!canPerformAction) {
                return res.status(403).json({ success: false, message: `Access denied: Cannot ${action} ${moduleKey}` });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during authorization' });
        }
    };
};

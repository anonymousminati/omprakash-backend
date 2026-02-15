import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthController {
    private userRepository = AppDataSource.getRepository(User);

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            const user = await this.userRepository.createQueryBuilder("user")
                .addSelect("user.password_hash")
                .where("user.email = :email", { email })
                .getOne();

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            if (!user.is_active) {
                return res.status(403).json({ success: false, message: 'Account is inactive' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            const userWithRole = await this.userRepository.findOne({
                where: { id: user.id },
                relations: ['role_relation', 'role_relation.permissions', 'role_relation.permissions.module']
            });

            // Construct metadata
            const can_read: string[] = [];
            const can_create: string[] = [];
            const can_update: string[] = [];
            const can_delete: string[] = [];

            if (userWithRole?.role_relation?.permissions) {
                userWithRole.role_relation.permissions.forEach(p => {
                    if (p.module) {
                        if (p.can_read) can_read.push(p.module.key);
                        if (p.can_create) can_create.push(p.module.key);
                        if (p.can_update) can_update.push(p.module.key);
                        if (p.can_delete) can_delete.push(p.module.key);
                    }
                });
            }

            const meta = {
                modules: {
                    can_read,
                    can_create,
                    can_update,
                    can_delete
                }
            };

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = userWithRole || user;

            return res.status(200).json({
                success: true,
                token,
                user: {
                    ...userWithoutPassword,
                    meta // Attach meta to user object
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Get current user profile
    getMe = async (req: Request, res: Response) => {
        try {
            // @ts-ignore - User is attached by middleware
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const userWithRole = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['role_relation', 'role_relation.permissions', 'role_relation.permissions.module']
            });

            if (!userWithRole) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Construct metadata
            const can_read: string[] = [];
            const can_create: string[] = [];
            const can_update: string[] = [];
            const can_delete: string[] = [];

            if (userWithRole?.role_relation?.permissions) {
                userWithRole.role_relation.permissions.forEach(p => {
                    if (p.module) {
                        if (p.can_read) can_read.push(p.module.key);
                        if (p.can_create) can_create.push(p.module.key);
                        if (p.can_update) can_update.push(p.module.key);
                        if (p.can_delete) can_delete.push(p.module.key);
                    }
                });
            }

            const meta = {
                modules: {
                    can_read,
                    can_create,
                    can_update,
                    can_delete
                }
            };

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = userWithRole;

            return res.status(200).json({
                success: true,
                data: {
                    ...userWithoutPassword,
                    meta
                }
            });
        } catch (error) {
            console.error('Get Me error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

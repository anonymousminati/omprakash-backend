import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/User';
import { Role } from '../../../models/Role';
import bcrypt from 'bcryptjs';

export class UserController {
    private userRepository = AppDataSource.getRepository(User);

    create = async (req: Request, res: Response) => {
        try {
            const { name, email, password, role } = req.body;

            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const RoleRepo = AppDataSource.getRepository(Role);
            const userRoleName = role || 'Citizen'; // Default to Citizen

            // Case-insensitive search for role
            const assignedRole = await RoleRepo.createQueryBuilder("role")
                .where("LOWER(role.name) = LOWER(:name)", { name: userRoleName })
                .getOne();

            if (!assignedRole) {
                return res.status(400).json({ success: false, message: `Role '${userRoleName}' not found` });
            }

            const user = this.userRepository.create({
                name,
                email,
                password_hash,
                role: assignedRole.name.toLowerCase(), // Maintain backward compat
                role_relation: assignedRole,
                is_active: true
            });

            await this.userRepository.save(user);

            const { password_hash: _, ...userWithoutPassword } = user;

            return res.status(201).json({ success: true, data: userWithoutPassword });
        } catch (error) {
            console.error('Create user error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    list = async (req: Request, res: Response) => {
        try {
            const users = await this.userRepository.find({
                order: { created_at: 'DESC' }
            });
            return res.status(200).json({ success: true, data: users });
        } catch (error) {
            console.error('List users error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.userRepository.delete(id);

            if (result.affected === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            return res.status(200).json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

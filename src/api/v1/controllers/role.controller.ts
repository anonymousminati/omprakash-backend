import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { Role } from '../../../models/Role';

export class RoleController {
    private roleRepository = AppDataSource.getRepository(Role);

    list = async (req: Request, res: Response) => {
        try {
            const roles = await this.roleRepository.find({
                order: { name: 'ASC' }
            });
            return res.status(200).json({ success: true, data: roles });
        } catch (error) {
            console.error('List roles error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;

            const existing = await this.roleRepository.findOneBy({ name });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Role already exists' });
            }

            const role = this.roleRepository.create({ name, description });
            await this.roleRepository.save(role);

            return res.status(201).json({ success: true, data: role });
        } catch (error) {
            console.error('Create role error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

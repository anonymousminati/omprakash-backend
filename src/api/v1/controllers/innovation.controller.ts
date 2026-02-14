import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../config/database';
import { Innovation, InnovationStatus } from '../../../models/Innovation';

export class InnovationController {
    private innovationRepository = AppDataSource.getRepository(Innovation);

    // Create a new innovation
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, description, category, full_name, email_address, phone_number, attachment_url } = req.body;

            const innovation = this.innovationRepository.create({
                title,
                description,
                category,
                full_name,
                email_address,
                phone_number,
                attachment_url,
                status: InnovationStatus.PENDING
            });

            await this.innovationRepository.save(innovation);
            res.status(201).json({ success: true, data: innovation });
        } catch (error) {
            next(error);
        }
    };

    // List innovations with pagination, filtering, and dynamic fields
    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 10, fields, status, category } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            // Dynamic Field Selection logic: "by default get only ID of record"
            // Dynamic Field Selection logic
            let select: any = undefined;
            if (fields) {
                select = { id: true };
                const requestedFields = (fields as string).split(',');
                requestedFields.reduce((acc: any, field: string) => {
                    acc[field.trim()] = true;
                    return acc;
                }, select);
            }

            const where: any = {};
            if (status) where.status = status;
            if (category) where.category = category;

            const [innovations, total] = await this.innovationRepository.findAndCount({
                select: select,
                where: where,
                skip: skip,
                take: Number(limit),
                order: { created_at: 'DESC' }
            });

            res.status(200).json({
                success: true,
                count: total,
                data: innovations,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // Get single innovation
    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const innovation = await this.innovationRepository.findOneBy({ id });

            if (!innovation) {
                return res.status(404).json({ success: false, message: 'Innovation not found' });
            }

            res.status(200).json({ success: true, data: innovation });
        } catch (error) {
            next(error);
        }
    };

    // Update innovation
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status, title, description, category } = req.body;

            let innovation = await this.innovationRepository.findOneBy({ id });
            if (!innovation) {
                return res.status(404).json({ success: false, message: 'Innovation not found' });
            }

            if (status) innovation.status = status;
            if (title) innovation.title = title;
            if (description) innovation.description = description;
            if (category) innovation.category = category;

            await this.innovationRepository.save(innovation);
            res.status(200).json({ success: true, data: innovation });
        } catch (error) {
            next(error);
        }
    };

    // Delete innovation
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.innovationRepository.delete(id);

            if (result.affected === 0) {
                return res.status(404).json({ success: false, message: 'Innovation not found' });
            }

            res.status(200).json({ success: true, message: 'Innovation deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}

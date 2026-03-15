import { Request, Response, NextFunction } from 'express';
import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { Complaint, ComplaintStatus } from '../../../models/Complaint';
import { uploadImage, getFullCdnUrl, deleteImage } from '../../../services/bunnyService';

export class ComplaintController {
    private complaintRepository = AppDataSource.getRepository(Complaint);

    // Create a new complaint
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { full_name, phone_number, email_address, location, category, subject, description, geolocation } = req.body;
            let photo_url = req.body.photo_url || null;

            if (req.file) {
                const uploadedPath = await uploadImage(req.file.buffer, 'complaints');
                photo_url = getFullCdnUrl(uploadedPath);
            }

            // Parse GPS coords sent as JSON string from the website form
            let geo_latitude: number | null = null;
            let geo_longitude: number | null = null;
            let geo_accuracy: number | null = null;
            if (geolocation) {
                try {
                    const geo = typeof geolocation === 'string' ? JSON.parse(geolocation) : geolocation;
                    geo_latitude  = typeof geo.latitude  === 'number' ? geo.latitude  : null;
                    geo_longitude = typeof geo.longitude === 'number' ? geo.longitude : null;
                    geo_accuracy  = typeof geo.accuracy  === 'number' ? geo.accuracy  : null;
                } catch {
                    // malformed geolocation — ignore, store nulls
                }
            }

            const payload: DeepPartial<Complaint> = {
                full_name,
                phone_number,
                email_address,
                location,
                category,
                subject,
                description,
                photo_url,
                status: ComplaintStatus.OPEN,
            };
            if (geo_latitude  !== null) payload.geo_latitude  = geo_latitude;
            if (geo_longitude !== null) payload.geo_longitude = geo_longitude;
            if (geo_accuracy  !== null) payload.geo_accuracy  = geo_accuracy;

            const complaint = this.complaintRepository.create(payload);

            await this.complaintRepository.save(complaint);
            res.status(201).json({ success: true, data: complaint });
        } catch (error) {
            next(error);
        }
    };

    // List complaints
    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 10, status, category } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};
            if (status) where.status = status;
            if (category) where.category = category;

            const [complaints, total] = await this.complaintRepository.findAndCount({
                where: where,
                skip: skip,
                take: Number(limit),
                order: { created_at: 'DESC' }
            });

            res.status(200).json({
                success: true,
                count: total,
                data: complaints,
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

    // Get single complaint
    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const complaint = await this.complaintRepository.findOneBy({ id });

            if (!complaint) {
                return res.status(404).json({ success: false, message: 'Complaint not found' });
            }

            res.status(200).json({ success: true, data: complaint });
        } catch (error) {
            next(error);
        }
    };

    // Update complaint
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { full_name, phone_number, email_address, location, category, subject, description, status } = req.body;

            const complaint = await this.complaintRepository.findOneBy({ id });
            if (!complaint) {
                return res.status(404).json({ success: false, message: 'Complaint not found' });
            }

            if (req.file) {
                // Determine category for folder structure in Bunny.net. Let's assume complaints flow uses 'complaints'
                const uploadedPath = await uploadImage(req.file.buffer, 'complaints');
                const newPhotoUrl = getFullCdnUrl(uploadedPath);

                // Cleanup old associated image on CDN
                if (complaint.photo_url) {
                    try {
                        const urlObj = new URL(complaint.photo_url);
                        let relativePath = urlObj.pathname;
                        if (relativePath.startsWith('/')) {
                            relativePath = relativePath.substring(1);
                        }
                        await deleteImage(relativePath);
                    } catch (err) {
                        console.error('Failed to delete old image from CDN during update:', err);
                    }
                }
                complaint.photo_url = newPhotoUrl;
            }

            if (full_name) complaint.full_name = full_name;
            if (phone_number) complaint.phone_number = phone_number;
            if (email_address) complaint.email_address = email_address;
            if (location) complaint.location = location;
            if (category) complaint.category = category;
            if (subject) complaint.subject = subject;
            if (description) complaint.description = description;
            if (status) complaint.status = status;

            await this.complaintRepository.save(complaint);
            res.status(200).json({ success: true, data: complaint });
        } catch (error) {
            next(error);
        }
    };

    // Delete complaint
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const complaint = await this.complaintRepository.findOneBy({ id });

            if (!complaint) {
                return res.status(404).json({ success: false, message: 'Complaint not found' });
            }

            // Cleanup associated image on CDN
            if (complaint.photo_url) {
                try {
                    const urlObj = new URL(complaint.photo_url);
                    let relativePath = urlObj.pathname;
                    if (relativePath.startsWith('/')) {
                        relativePath = relativePath.substring(1);
                    }
                    await deleteImage(relativePath);
                } catch (err) {
                    console.error('Failed to delete image from CDN:', err);
                }
            }

            await this.complaintRepository.remove(complaint);
            res.status(200).json({ success: true, message: 'Complaint deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}

import { Request, Response, NextFunction } from 'express';
import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { Complaint, ComplaintStatus } from '../../../models/Complaint';
import { uploadImage, getFullCdnUrl, deleteImage } from '../../../services/bunnyService';
import { emailService } from '../../../services/email.service';

export class ComplaintController {
    private complaintRepository = AppDataSource.getRepository(Complaint);

    // Create a new complaint
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { full_name, phone_number, email_address, location, ward, category, subject, description, geolocation } = req.body;
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
                ward: ward || null,
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

            // Send email to Citizen
            if (complaint.email_address) {
                try {
                    const citizenHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                                <h2 style="margin: 0; color: #333;">Complaint Registered Successfully</h2>
                            </div>
                            <div style="padding: 20px; color: #555; line-height: 1.6;">
                                <p>Dear <strong>${complaint.full_name}</strong>,</p>
                                <p>Thank you for reaching out. Your complaint has been registered successfully. Our team will look into it shortly.</p>
                                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Subject:</strong> ${complaint.subject}</p>
                                    <p style="margin: 5px 0;"><strong>Category:</strong> ${complaint.category}</p>
                                    <p style="margin: 5px 0;"><strong>Description:</strong> ${complaint.description}</p>
                                </div>
                                <p>For more updates and information about our initiatives, please visit our official website:</p>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="https://omprakashkhursade.in" style="background-color: #0056b3; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">Visit omprakashkhursade.in</a>
                                </div>
                                <p style="margin-bottom: 0;">Best regards,<br><strong>Omprakash Khursade Office</strong></p>
                            </div>
                        </div>
                    `;
                    await emailService.sendEmail({
                        to: complaint.email_address,
                        subject: `Complaint Registered Successfully - ${complaint.subject}`,
                        html: citizenHtml
                    });
                } catch (e) {
                    console.error('Failed to send email to citizen:', e);
                }
            }

            // Send email to Office
            try {
                const officeEmail = process.env.SUPERADMIN_EMAIL || 'prathameshmalode.2@gmail.com';
                const officeHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #fff3cd; padding: 20px; text-align: center; border-bottom: 1px solid #ffeeba;">
                            <h2 style="margin: 0; color: #856404;">New Complaint Alert</h2>
                        </div>
                        <div style="padding: 20px; color: #555; line-height: 1.6;">
                            <p>A new complaint has been registered on the portal.</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">
                                <p style="margin: 5px 0;"><strong>Citizen:</strong> ${complaint.full_name}</p>
                                <p style="margin: 5px 0;"><strong>Phone:</strong> ${complaint.phone_number}</p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> ${complaint.email_address || 'N/A'}</p>
                                <p style="margin: 5px 0;"><strong>Subject:</strong> ${complaint.subject}</p>
                                <p style="margin: 5px 0;"><strong>Category:</strong> ${complaint.category}</p>
                                <p style="margin: 5px 0;"><strong>Location:</strong> ${complaint.location}</p>
                                <p style="margin: 5px 0;"><strong>Ward:</strong> ${complaint.ward || 'N/A'}</p>
                                <p style="margin: 15px 0 5px 0;"><strong>Description:</strong></p>
                                <p style="margin: 0; padding: 10px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 4px;">${complaint.description}</p>
                            </div>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="https://dash.omprakashkhursade.in" style="background-color: #28a745; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">View in Dashboard</a>
                            </div>
                        </div>
                    </div>
                `;
                await emailService.sendEmail({
                    to: officeEmail,
                    subject: `New Complaint Registered - ${complaint.subject}`,
                    html: officeHtml
                });
            } catch (e) {
                console.error('Failed to send email to office:', e);
            }

            res.status(201).json({ success: true, data: complaint });
        } catch (error) {
            next(error);
        }
    };

    // List complaints
    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 10, status, category, ward, dateFrom, dateTo } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};
            if (status) where.status = status;
            if (category) where.category = category;
            if (ward) where.ward = ward;

            // Date range filtering on created_at
            if (dateFrom || dateTo) {
                const { Between, MoreThanOrEqual, LessThanOrEqual } = require('typeorm');
                if (dateFrom && dateTo) {
                    where.created_at = Between(new Date(dateFrom as string), new Date(dateTo + 'T23:59:59'));
                } else if (dateFrom) {
                    where.created_at = MoreThanOrEqual(new Date(dateFrom as string));
                } else if (dateTo) {
                    where.created_at = LessThanOrEqual(new Date(dateTo + 'T23:59:59'));
                }
            }

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
            const { full_name, phone_number, email_address, location, ward, category, subject, description, status } = req.body;

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
            if (ward !== undefined) complaint.ward = ward || null;
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

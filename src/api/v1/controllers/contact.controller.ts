import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { Contact } from '../../../models/Contact';

const contactRepository = AppDataSource.getRepository(Contact);

export const createContact = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        const newContact = contactRepository.create({
            name,
            email,
            phone,
            subject,
            message,
            isRead: false
        });

        const savedContact = await contactRepository.save(newContact);

        res.status(201).json({
            success: true,
            data: savedContact,
            message: 'Contact message submitted successfully'
        });
    } catch (error: any) {
        console.error('Error in createContact:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getContacts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [contacts, total] = await contactRepository.findAndCount({
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error in getContacts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getContactById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contact = await contactRepository.findOneBy({ id });

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact message not found' });
        }

        res.status(200).json({ success: true, data: contact });
    } catch (error: any) {
        console.error('Error in getContactById:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contact = await contactRepository.findOneBy({ id });

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact message not found' });
        }

        contact.isRead = true;
        await contactRepository.save(contact);

        res.status(200).json({ success: true, message: 'Marked as read', data: contact });
    } catch (error: any) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contact = await contactRepository.findOneBy({ id });

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact message not found' });
        }

        await contactRepository.remove(contact);
        res.status(200).json({ success: true, message: 'Contact message deleted successfully' });
    } catch (error: any) {
        console.error('Error in deleteContact:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

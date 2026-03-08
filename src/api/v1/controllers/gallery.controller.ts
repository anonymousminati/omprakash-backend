import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { GalleryCategory } from '../../../models/GalleryCategory';
import { GalleryImage } from '../../../models/GalleryImage';
import { In } from 'typeorm';
import { uploadImage, deleteImage, getFullCdnUrl } from '../../../services/bunnyService';

const categoryRepo = AppDataSource.getRepository(GalleryCategory);
const imageRepo = AppDataSource.getRepository(GalleryImage);

// -------------------------------------------------------------
// Category Endpoints
// -------------------------------------------------------------

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await categoryRepo.find({ order: { created_at: 'DESC' } });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, slug, description } = req.body;

        let existing = await categoryRepo.findOneBy({ slug });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Slug already exists' });
        }

        const category = categoryRepo.create({ name, slug, description });
        await categoryRepo.save(category);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create category' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;

        let category = await categoryRepo.findOneBy({ id });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.name = name ?? category.name;
        category.slug = slug ?? category.slug;
        category.description = description ?? category.description;

        await categoryRepo.save(category);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await categoryRepo.findOneBy({ id });
        if (!category) return res.status(404).json({ success: false, message: 'Not found' });

        await categoryRepo.remove(category);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await categoryRepo.findOneBy({ id });
        if (!category) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
};

// -------------------------------------------------------------
// Image Endpoints
// -------------------------------------------------------------

export const getImages = async (req: Request, res: Response) => {
    try {
        const queryBuilder = imageRepo.createQueryBuilder('image')
            .leftJoinAndSelect('image.categories', 'categories');

        // Allow public frontend filtering by category and published status
        if (req.query.categoryId) {
            queryBuilder.andWhere('categories.id = :categoryId', { categoryId: req.query.categoryId });
        }
        if (req.query.is_published === 'true') {
            queryBuilder.andWhere('image.is_published = :isPublished', { isPublished: true });
        }
        if (req.query.is_featured === 'true') {
            queryBuilder.andWhere('image.is_featured = :isFeatured', { isFeatured: true });
        }

        // Sorting
        if (req.query.sort === 'latest') {
            queryBuilder.orderBy('image.created_at', 'DESC');
        } else {
            // Default Admin behavior
            queryBuilder.orderBy('image.sequence', 'ASC')
                .addOrderBy('image.created_at', 'DESC');
        }

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50; // default large limit if unspecified
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [images, total] = await queryBuilder.getManyAndCount();

        // Attach full CDN URL
        const data = images.map(img => ({
            ...img,
            fullUrl: getFullCdnUrl(img.url)
        }));

        res.json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fetch Images Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch images' });
    }
};

export const uploadGalleryImage = async (req: Request, res: Response) => {
    try {
        const { title, description, is_published, is_featured, sequence, category_ids } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded' });
        }

        // Upload to Bunny CDN via existing service utility
        // The service automatically converts buffers to WebP format
        const relativePath = await uploadImage(req.file.buffer, 'gallery');

        // Resolve Category relationships
        let mappedCategories: GalleryCategory[] = [];
        if (category_ids) {
            // handle JSON array payload from FormData
            const parsedIds = typeof category_ids === 'string' ? JSON.parse(category_ids) : category_ids;
            if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                mappedCategories = await categoryRepo.findBy({ id: In(parsedIds) });
            }
        }

        const newImage = imageRepo.create({
            title,
            description,
            is_published: is_published === 'true' || is_published === true,
            is_featured: is_featured === 'true' || is_featured === true,
            sequence: sequence ? parseInt(sequence, 10) : 0,
            url: relativePath,
            categories: mappedCategories,
        });

        await imageRepo.save(newImage);

        res.status(201).json({
            success: true,
            data: {
                ...newImage,
                fullUrl: getFullCdnUrl(newImage.url)
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Error uploading gallery image' });
    }
};

export const updateImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, is_published, is_featured, sequence, category_ids } = req.body;

        const image = await imageRepo.findOne({ where: { id }, relations: ['categories'] });
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        image.title = title ?? image.title;
        image.description = description ?? image.description;
        if (is_published !== undefined) image.is_published = is_published === 'true' || is_published === true;
        if (is_featured !== undefined) image.is_featured = is_featured === 'true' || is_featured === true;
        if (sequence !== undefined) image.sequence = parseInt(sequence, 10);

        if (category_ids) {
            const parsedIds = typeof category_ids === 'string' ? JSON.parse(category_ids) : category_ids;
            image.categories = await categoryRepo.findBy({ id: In(parsedIds) });
        }

        // Handle replacement photo logic
        if (req.file) {
            const relativePath = await uploadImage(req.file.buffer, 'gallery');
            // Clean up old image asynchronously
            deleteImage(image.url).catch(err => console.error("Failed to delete replacing image from Bunny CDN:", err));
            image.url = relativePath;
        }

        await imageRepo.save(image);
        res.json({ success: true, data: image });
    } catch (error) {
        console.error("Update Image Error:", error);
        res.status(500).json({ success: false, message: 'Failed to update image' });
    }
};

export const deleteGalleryImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const image = await imageRepo.findOneBy({ id });
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Attempt Bunny CDN deletion
        if (image.url) {
            deleteImage(image.url).catch(err => console.error("Could not delete from Bunny CDN:", err));
        }

        await imageRepo.remove(image);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
};

export const getImageById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const image = await imageRepo.findOne({ where: { id }, relations: ['categories'] });
        if (!image) return res.status(404).json({ success: false, message: 'Not found' });

        res.json({
            success: true,
            data: {
                ...image,
                fullUrl: getFullCdnUrl(image.url)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
};

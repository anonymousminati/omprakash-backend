import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../config/database';
import { Post } from '../../../models/Post';
import { uploadImage, getFullCdnUrl, deleteImage } from '../../../services/bunnyService';

// Slug generator: "My Post Title" → "my-post-title"
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export class PostController {
    private repo = AppDataSource.getRepository(Post);

    // ── Public: list published posts ────────────────────────────────────────────
    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 9, category } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const qb = this.repo.createQueryBuilder('p')
                .where('p.is_published = :pub', { pub: true })
                .orderBy('p.published_at', 'DESC')
                .skip(skip)
                .take(Number(limit));

            if (category) qb.andWhere('p.category = :category', { category });

            const [posts, total] = await qb.getManyAndCount();

            res.json({
                success: true,
                data: posts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                    total,
                },
            });
        } catch (err) { next(err); }
    };

    // ── Public: single post by slug ─────────────────────────────────────────────
    getBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { slug } = req.params;
            const post = await this.repo.findOneBy({ slug });
            if (!post || !post.is_published) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }
            res.json({ success: true, data: post });
        } catch (err) { next(err); }
    };

    // ── Protected: list ALL posts (backpanel) ───────────────────────────────────
    listAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 20, category, is_published } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const qb = this.repo.createQueryBuilder('p')
                .orderBy('p.created_at', 'DESC')
                .skip(skip)
                .take(Number(limit));

            if (category) qb.andWhere('p.category = :category', { category });
            if (is_published !== undefined) qb.andWhere('p.is_published = :pub', { pub: is_published === 'true' });

            const [posts, total] = await qb.getManyAndCount();

            res.json({
                success: true,
                data: posts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                    total,
                },
            });
        } catch (err) { next(err); }
    };

    // ── Protected: get single post by ID (backpanel) ────────────────────────────
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const post = await this.repo.findOneBy({ id: req.params.id });
            if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
            res.json({ success: true, data: post });
        } catch (err) { next(err); }
    };

    // ── Protected: create post ──────────────────────────────────────────────────
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, description, content, author, category, is_published, is_official, slug: customSlug } = req.body;

            const slug = customSlug ? toSlug(customSlug) : toSlug(title);

            // Upload all images
            const files = req.files as Express.Multer.File[];
            const imageUrls: string[] = [];
            for (const file of files ?? []) {
                const path = await uploadImage(file.buffer, 'posts');
                imageUrls.push(getFullCdnUrl(path));
            }

            const isPublished = is_published === 'true' || is_published === true;
            const isOfficial  = is_official  === 'true' || is_official  === true;

            const post = this.repo.create({
                title,
                slug,
                description,
                content,
                author: author || 'Secretariat Office',
                category,
                is_published: isPublished,
                is_official: isOfficial,
                hero_image_url: imageUrls[0] ?? null,
                images: imageUrls.length ? imageUrls : [],
                published_at: isPublished ? new Date() : undefined,
            });

            await this.repo.save(post);
            res.status(201).json({ success: true, data: post });
        } catch (err) { next(err); }
    };

    // ── Protected: update post ──────────────────────────────────────────────────
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const post = await this.repo.findOneBy({ id: req.params.id });
            if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

            const { title, description, content, author, category, is_published, is_official, slug: customSlug, images: orderedImages } = req.body;

            const isPublished = is_published === 'true' || is_published === true;
            const isOfficial  = is_official  === 'true' || is_official  === true;

            // Upload new files (if any)
            const files = req.files as Express.Multer.File[];
            const newUrls: string[] = [];
            for (const file of files ?? []) {
                const path = await uploadImage(file.buffer, 'posts');
                newUrls.push(getFullCdnUrl(path));
            }

            // Reordered image list supplied by backpanel (drag-to-reorder result)
            let finalImages: string[] = post.images ?? [];
            if (orderedImages) {
                // orderedImages is a JSON string of the new order (existing + newly added)
                try { finalImages = JSON.parse(orderedImages); } catch { /* keep current */ }
            }
            if (newUrls.length) finalImages = [...finalImages, ...newUrls];

            post.title       = title       ?? post.title;
            post.slug        = customSlug  ? toSlug(customSlug) : (title ? toSlug(title) : post.slug);
            post.description = description ?? post.description;
            post.content     = content     ?? post.content;
            post.author      = author      ?? post.author;
            post.category    = category    ?? post.category;
            post.images      = finalImages;
            post.hero_image_url = finalImages[0] ?? post.hero_image_url;
            post.is_official = isOfficial;

            // Only set published_at once
            if (isPublished && !post.is_published) post.published_at = new Date();
            post.is_published = isPublished;

            await this.repo.save(post);
            res.json({ success: true, data: post });
        } catch (err) { next(err); }
    };

    // ── Protected: delete post ──────────────────────────────────────────────────
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const post = await this.repo.findOneBy({ id: req.params.id });
            if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

            // Remove images from CDN
            for (const url of post.images ?? []) {
                try { await deleteImage(url); } catch { /* log and continue */ }
            }

            await this.repo.remove(post);
            res.json({ success: true, message: 'Post deleted' });
        } catch (err) { next(err); }
    };
}

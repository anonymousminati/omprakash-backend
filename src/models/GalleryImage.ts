import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { Base } from './Base';
import { GalleryCategory } from './GalleryCategory';

@Entity('gallery_images')
export class GalleryImage extends Base {
    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    file_id: string; // To track SunnyNet ID if needed

    @Column({ default: true })
    is_published: boolean;

    @Column({ default: false })
    is_featured: boolean;

    @Column({ default: 0 })
    sequence: number;

    @ManyToMany(() => GalleryCategory, category => category.images)
    @JoinTable({
        name: 'gallery_images_categories',
        joinColumn: { name: 'image_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
    })
    categories: GalleryCategory[];
}

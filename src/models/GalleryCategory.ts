import { Entity, Column, OneToMany, ManyToMany } from 'typeorm';
import { Base } from './Base';
import { GalleryImage } from './GalleryImage';

@Entity('gallery_categories')
export class GalleryCategory extends Base {
    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToMany(() => GalleryImage, image => image.categories)
    images: GalleryImage[];
}

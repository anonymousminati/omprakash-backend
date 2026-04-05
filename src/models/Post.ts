import { Entity, Column } from 'typeorm';
import { Base } from './Base';

@Entity('posts')
export class Post extends Base {
    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ length: 500, nullable: true })
    description: string;

    @Column({ type: 'longtext', nullable: true })
    content: string; // HTML from Tiptap

    @Column({ default: 'Secretariat Office' })
    author: string;

    @Column({ nullable: true })
    category: string;

    @Column({ default: false })
    is_published: boolean;

    @Column({ default: false })
    is_official: boolean;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    hero_image_url: string;

    @Column({ type: 'simple-json', nullable: true })
    images: string[];

    @Column({ type: 'datetime', nullable: true })
    published_at: Date;
}

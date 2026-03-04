import { Entity, Column } from 'typeorm';
import { Base } from './Base';

@Entity('files')
export class File extends Base {
    @Column()
    filename: string;

    @Column('text')
    cdn_url: string;

    @Column({
        type: 'enum',
        enum: ['complaint', 'gallery', 'profile'],
    })
    category: string;
}

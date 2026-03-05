import { Entity, Column } from 'typeorm';
import { Base } from './Base';

@Entity('contacts')
export class Contact extends Base {
    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column()
    subject: string;

    @Column('text')
    message: string;

    @Column({ default: false })
    isRead: boolean;
}

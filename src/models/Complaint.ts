import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('complaints')
export class Complaint extends Base {
    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ default: 'PENDING' }) // PENDING, IN_PROGRESS, RESOLVED, REJECTED
    status: string;

    @Column({ nullable: true })
    image_url: string;

    @Column()
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}

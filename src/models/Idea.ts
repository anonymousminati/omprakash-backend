import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('ideas')
export class Idea extends Base {
    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ default: 0 })
    votes: number;

    @Column({ nullable: true })
    image_url: string;

    @Column()
    user_id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}

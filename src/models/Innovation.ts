import { Entity, Column } from 'typeorm';
import { Base } from './Base';

export enum InnovationStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('innovations')
export class Innovation extends Base {
    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column()
    category: string;

    @Column()
    full_name: string;

    @Column({ nullable: true })
    email_address: string;

    @Column()
    phone_number: string;

    @Column({
        type: 'enum',
        enum: InnovationStatus,
        default: InnovationStatus.PENDING
    })
    status: InnovationStatus;

    @Column({ nullable: true })
    attachment_url: string;
}

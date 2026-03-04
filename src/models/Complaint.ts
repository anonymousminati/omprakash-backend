import { Entity, Column } from 'typeorm';
import { Base } from './Base';

export enum ComplaintStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED"
}

@Entity('complaints')
export class Complaint extends Base {
    @Column()
    full_name: string;

    @Column()
    phone_number: string;

    @Column({ nullable: true })
    email_address: string;

    @Column()
    location: string;

    @Column()
    category: string;

    @Column()
    subject: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    photo_url: string;

    @Column({
        type: "enum",
        enum: ComplaintStatus,
        default: ComplaintStatus.OPEN
    })
    status: ComplaintStatus;
}

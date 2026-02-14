import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { Role } from './Role';

@Entity('users')
export class User extends Base {
    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password_hash: string;

    @Column({ default: 'citizen' }) // Deprecated: use role_relation
    role: string;

    @Column({ nullable: true })
    role_id: string;

    @ManyToOne(() => Role, (role) => role.users)
    @JoinColumn({ name: 'role_id' })
    role_relation: Role;

    @Column({ default: true })
    is_active: boolean;
}

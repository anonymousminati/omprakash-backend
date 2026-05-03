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

    /**
     * Ward access list.
     * - `["ALL"]`                → user can see/manage complaints from all wards
     * - `["Ward 1", "Ward 5"]`   → user can only see/manage complaints in these wards
     * - `[]` or null              → no ward-specific access (e.g. citizens)
     */
    @Column({ type: 'simple-json', nullable: true })
    assigned_wards: string[] | null;

    @Column({ default: true })
    is_active: boolean;
}

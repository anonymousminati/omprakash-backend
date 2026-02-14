import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from './Base';
import { Permission } from './Permission';

@Entity('modules')
export class Module extends Base {
    @Column({ unique: true })
    key: string; // e.g., 'innovations', 'users'

    @Column()
    name: string; // e.g., 'Innovations', 'System Users'

    @OneToMany(() => Permission, (permission) => permission.module)
    permissions: Permission[];
}

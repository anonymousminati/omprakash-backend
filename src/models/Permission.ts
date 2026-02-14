import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { Role } from './Role';
import { Module } from './Module';

@Entity('permissions')
export class Permission extends Base {
    @Column()
    role_id: string;

    @Column()
    module_id: string;

    @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Module, (module) => module.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'module_id' })
    module: Module;

    @Column({ default: false })
    can_create: boolean;

    @Column({ default: false })
    can_read: boolean;

    @Column({ default: false })
    can_update: boolean;

    @Column({ default: false })
    can_delete: boolean;
}

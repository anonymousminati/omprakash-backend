import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from './Base';
import { User } from './User';
import { Permission } from './Permission';

@Entity('roles')
export class Role extends Base {
    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => User, (user) => user.role_relation)
    users: User[];

    @OneToMany(() => Permission, (permission) => permission.role)
    permissions: Permission[];
}
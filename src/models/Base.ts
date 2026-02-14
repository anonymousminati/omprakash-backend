import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity as TypeORMBaseEntity,
} from 'typeorm';

export abstract class Base extends TypeORMBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    created_by: string; // User ID

    @Column({ nullable: true })
    updated_by: string; // User ID
}

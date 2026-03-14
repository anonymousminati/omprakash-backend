import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity as TypeORMBaseEntity,
} from 'typeorm';

export abstract class Base extends TypeORMBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @Column({ type: 'varchar', length: 36, primary: true }) // Explicit MySQL mapping
    id: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ 
        type: 'timestamp', 
        default: () => 'CURRENT_TIMESTAMP', 
        onUpdate: 'CURRENT_TIMESTAMP' 
    })
    updated_at: Date;

    @Column({ type: 'varchar', length: 36, nullable: true })
    created_by: string; // User ID

    @Column({ type: 'varchar', length: 36, nullable: true })
    updated_by: string; // User ID
}
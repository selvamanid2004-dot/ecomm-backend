import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  user_id?: string | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  entity_type!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entity_id?: string | null;

  @Column({ type: 'json', nullable: true })
  details?: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}

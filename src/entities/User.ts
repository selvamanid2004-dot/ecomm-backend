import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Customer } from './Customer';

export type UserRole = 'admin' | 'manager' | 'customer';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 191, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash!: string;

  @Column({ type: 'varchar', length: 100 })
  first_name!: string;

  @Column({ type: 'varchar', length: 100 })
  last_name!: string;

  @Column({ type: 'enum', enum: ['admin', 'manager', 'customer'], default: 'customer' })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url?: string | null;

  @Column({ type: 'datetime', nullable: true })
  last_login_at?: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer?: Customer;
}

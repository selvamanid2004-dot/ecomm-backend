import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';

@Entity('customer_addresses')
export class CustomerAddress {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  customer_id!: string;

  @Column({ type: 'varchar', length: 50, default: 'Home' })
  label!: string;

  @Column({ type: 'varchar', length: 150 })
  recipient_name!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  street_address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apartment?: string | null;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code!: string;

  @Column({ type: 'varchar', length: 100, default: 'United States' })
  country!: string;

  @Column({ type: 'boolean', default: false })
  is_default_shipping!: boolean;

  @Column({ type: 'boolean', default: false })
  is_default_billing!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;
}

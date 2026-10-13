import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { OrderItem } from './OrderItem';
import { OrderStatusHistory } from './OrderStatusHistory';
import { Payment } from './Payment';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  order_number!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  invoice_number?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customer_id?: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  guest_email?: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'refunded', 'failed'],
    default: 'unpaid',
  })
  payment_status!: PaymentStatus;

  @Column({ type: 'varchar', length: 50, default: 'credit_card' })
  payment_method!: string;

  @Column({ type: 'varchar', length: 100, default: 'Standard Delivery' })
  shipping_method!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  discount_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  shipping_fee!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount!: number;

  @Column({ type: 'json' })
  shipping_address_json!: any;

  @Column({ type: 'json' })
  billing_address_json!: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, { cascade: true })
  status_history!: OrderStatusHistory[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments!: Payment[];
}

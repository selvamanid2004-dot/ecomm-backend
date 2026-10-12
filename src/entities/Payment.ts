import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';

export type PaymentTransactionStatus = 'initiated' | 'pending' | 'succeeded' | 'failed' | 'refunded';

@Entity('payments')
export class Payment {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  order_id!: string;

  @Column({ type: 'varchar', length: 50 })
  payment_method!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  transaction_reference!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: ['initiated', 'pending', 'succeeded', 'failed', 'refunded'],
    default: 'initiated',
  })
  status!: PaymentTransactionStatus;

  @Column({ type: 'json', nullable: true })
  gateway_response?: any;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}

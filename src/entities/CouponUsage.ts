import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Coupon } from './Coupon';
import { Order } from './Order';

@Entity('coupon_usages')
export class CouponUsage {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  coupon_id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customer_id?: string | null;

  @Column({ type: 'varchar', length: 36 })
  order_id!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discount_applied!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon!: Coupon;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}

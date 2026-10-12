import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CouponUsage } from './CouponUsage';

export type CouponDiscountType = 'percentage' | 'fixed';

@Entity('coupons')
export class Coupon {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: ['percentage', 'fixed'], default: 'percentage' })
  discount_type!: CouponDiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discount_value!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  min_order_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  max_discount_amount?: number | null;

  @Column({ type: 'int', nullable: true })
  usage_limit?: number | null;

  @Column({ type: 'int', default: 0 })
  usage_count!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages!: CouponUsage[];
}

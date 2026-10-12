import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  order_id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  product_id?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variant_id?: string | null;

  @Column({ type: 'varchar', length: 200 })
  product_name!: string;

  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  product_image_url?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;
}

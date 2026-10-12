import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity('price_history')
export class PriceHistory {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  old_price!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  new_price!: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  changed_by_user_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Product, (product) => product.price_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}

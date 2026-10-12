import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option1_name?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option1_value?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option2_name?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option2_value?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price_override?: number | null;

  @Column({ type: 'int', default: 0 })
  stock_quantity!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}

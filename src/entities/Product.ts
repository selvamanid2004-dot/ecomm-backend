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
import { Category } from './Category';
import { ProductImage } from './ProductImage';
import { ProductVariant } from './ProductVariant';
import { PriceHistory } from './PriceHistory';
import { InventoryAdjustment } from './InventoryAdjustment';
import { Review } from './Review';

@Entity('products')
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ type: 'longtext' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  short_description?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  category_id?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  base_price!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compare_at_price?: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost_price?: number | null;

  @Column({ type: 'int', default: 0 })
  stock_quantity!: number;

  @Column({ type: 'int', default: 5 })
  low_stock_threshold!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured!: boolean;

  @Column({ type: 'boolean', default: true })
  is_in_stock!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  meta_title?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  meta_description?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images!: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants!: ProductVariant[];

  @OneToMany(() => PriceHistory, (history) => history.product)
  price_history!: PriceHistory[];

  @OneToMany(() => InventoryAdjustment, (adj) => adj.product)
  inventory_adjustments!: InventoryAdjustment[];

  @OneToMany(() => Review, (review) => review.product)
  reviews!: Review[];
}
